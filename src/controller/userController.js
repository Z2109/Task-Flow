
import userModel from "../models/userModel.js";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sendEmail from "../utils/emailService.js";
import Invitation from "../models/invitationModel.js";

// Generate JWT token
const createToken = (id) => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// Normalize email addresses
const normalizeEmail = (email) => {
    return email.trim().toLowerCase();
};

// ==============================
// USER LOGIN
// ==============================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // IMPORTANT: Explicitly retrieve password hash
    const user = await userModel
      .findOne({ email: normalizedEmail })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Contact your administrator.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = createToken(user._id.toString());

    // Return authenticated user
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        jobTitle: user.jobTitle || "",
        department: user.department || "",
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};


// ==============================
// USER REGISTRATION
// ==============================
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        const normalizedEmail = normalizeEmail(email);

        const exists = await userModel.findOne({
            email: normalizedEmail,
        });

        if (exists) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );

        const newUser = new userModel({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        const user = await newUser.save();

        const token = createToken(user._id.toString());

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to register user",
        });
    }
};

// ==============================
// FORGOT PASSWORD
// ==============================
const forgotPassword = async (req, res) => {
    let user;

    try {
        const { email } = req.body;

        if (
            typeof email !== "string" ||
            !validator.isEmail(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email",
            });
        }

        const normalizedEmail = normalizeEmail(email);

        user = await userModel.findOne({
            email: normalizedEmail,
        });

        const genericMessage =
            "If an account exists with this email, a reset link will be sent.";

        // Do not reveal whether the account exists.
        if (!user) {
            return res.status(200).json({
                success: true,
                message: genericMessage,
            });
        }

        if (!process.env.CLIENT_URL) {
            throw new Error("CLIENT_URL is not configured");
        }

        // Generate a cryptographically secure token.
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Store only the SHA-256 hash of the token.
        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // Token expires after 15 minutes.
        user.resetPasswordExpires = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await user.save();

        const clientUrl = process.env.CLIENT_URL.replace(/\/$/, "");

        const resetUrl =
            `${clientUrl}/reset-password/${resetToken}`;

        try {
            await sendEmail({
                to: user.email,
                subject: "Reset Your TaskFlow Password",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                        <h2>Reset Your TaskFlow Password</h2>
                        <p>We received a request to reset your password.</p>
                        <p>
                            <a href="${resetUrl}"
                               style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;">
                                Reset Password
                            </a>
                        </p>
                        <p>This link expires in 15 minutes.</p>
                        <p>If you did not request this, you can safely ignore this email.</p>
                    </div>
                `,
            });
        } catch (emailError) {
            // Clear the token if the email cannot be sent.
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            throw emailError;
        }

        return res.status(200).json({
            success: true,
            message: genericMessage,
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to process password reset request",
        });
    }
};

// ==============================
// RESET PASSWORD
// ==============================
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (
            typeof token !== "string" ||
            !/^[a-f0-9]{64}$/i.test(token)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset link",
            });
        }

        if (
            typeof password !== "string" ||
            password.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        // Hash the received token to find the stored token hash.
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset link",
            });
        }

        // Hash the new password before saving.
        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        // Make the reset token single-use.
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. Please log in.",
        });
    } catch (error) {
        console.error("Reset password error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password",
        });
    }
};

// GET LOGGED-IN USER PROFILE
const getCurrentUser = async (req, res) => {
    try {
        const user = await userModel
            .findById(req.userId)
            .select("-password -resetPasswordToken -resetPasswordExpires");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
    try {
        const { name, jobTitle, department, bio } = req.body;

        const updates = {};

        if (name !== undefined) updates.name = name.trim();
        if (jobTitle !== undefined) updates.jobTitle = jobTitle.trim();
        if (department !== undefined) updates.department = department.trim();
        if (bio !== undefined) updates.bio = bio.trim();

        if (!Object.keys(updates).length) {
            return res.status(400).json({
                success: false,
                message: "No fields provided",
            });
        }

        const user = await userModel.findByIdAndUpdate(
            req.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// CHANGE PASSWORD
 const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    // IMPORTANT: Explicitly include the password field
    const user = await userModel
      .findById(req.userId)
      .select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        success: false,
        message: "User password hash is missing",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    next(error);
  }
};

const registerInvitedUser = async (req, res) => {
    try {
        const { token } = req.params;
        const { name, password } = req.body;

        // 1. Validate invitation token format
        if (
            typeof token !== "string" ||
            !/^[a-f0-9]{64}$/i.test(token)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid invitation link.",
            });
        }

        // 2. Validate form fields
        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and password are required.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long.",
            });
        }

        // 3. Hash the invitation token
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // 4. Find a valid, pending invitation
        const invitation = await Invitation.findOne({
            tokenHash,
            status: "pending",
            expiresAt: { $gt: new Date() },
        });

        if (!invitation) {
            return res.status(400).json({
                success: false,
                message: "This invitation is invalid, expired, or already used.",
            });
        }

        // 5. Use the email stored in the invitation.
        // Never accept a different email from the frontend.
        const normalizedEmail = invitation.email
            .trim()
            .toLowerCase();

        // 6. Prevent duplicate TaskFlow accounts
        const existingUser = await userModel.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email. Please sign in instead.",
            });
        }

        // 7. Hash password
        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );

        // 8. Create the user account
        const newUser = new userModel({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        const user = await newUser.save();

        // 9. Generate JWT
        const authToken = createToken(user._id.toString());

        // Important:
        // Membership and organization role are assigned
        // by acceptInvitation after authentication.

        return res.status(201).json({
            success: true,
            message: "Account created successfully. Accepting your invitation is the next step.",
            token: authToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("Invited registration error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email. Please sign in instead.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create your account.",
        });
    }
};

export {
    loginUser,
    registerUser,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateProfile,
    changePassword,
    registerInvitedUser
};
