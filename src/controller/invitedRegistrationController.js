
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

import User from "../models/userModel.js";
import Invitation from "../models/invitationModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";

// Generate authentication token
const createToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Hash invitation token
const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

// POST /api/user/register-invited/:token
export const registerInvitedUser = async (req, res) => {
  let createdUser = null;

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

    // 2. Validate registration fields
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

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    // 3. Find valid pending invitation
    const invitation = await Invitation.findOne({
      tokenHash: hashToken(token),
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("organization", "name isActive")
      .populate("role", "name description");

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "This invitation is invalid, expired, or already used.",
      });
    }

    if (
      !invitation.organization ||
      invitation.organization.isActive === false ||
      !invitation.role
    ) {
      return res.status(400).json({
        success: false,
        message: "The organization or assigned role is unavailable.",
      });
    }

    // 4. Email is taken from the invitation.
    // Never accept an arbitrary email from the browser.
    const invitedEmail = invitation.email
      .trim()
      .toLowerCase();

    if (!validator.isEmail(invitedEmail)) {
      return res.status(400).json({
        success: false,
        message: "The invitation contains an invalid email address.",
      });
    }

    // 5. Check whether account already exists
    const existingUser = await User.findOne({
      email: invitedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: "ACCOUNT_EXISTS",
        message: "An account already exists with this email. Please sign in to accept the invitation.",
      });
    }

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Create normal user.
    // No organization is created.
    // No Owner role is assigned.
    createdUser = await User.create({
      name: name.trim(),
      email: invitedEmail,
      password: hashedPassword,
    });

    // 8. Create pending organization membership.
    // The accept-invitation endpoint will activate it.
    await OrganizationMember.create({
      organization: invitation.organization._id,
      user: createdUser._id,
      status: "invited",
      joinedAt: null,
    });

    // 9. Generate JWT
    const authToken = createToken(
      createdUser._id.toString()
    );

    return res.status(201).json({
      success: true,
      message: "Your account has been created. Accept your invitation to join the team.",

      token: authToken,

      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
      },

      invitation: {
        organizationId: invitation.organization._id,
        organizationName: invitation.organization.name,
        roleName: invitation.role.name,
      },
    });

  } catch (error) {
    console.error("Invited user registration error:", error);

    // Clean up the newly created account if membership creation failed.
    if (createdUser?._id) {
      try {
        await OrganizationMember.deleteOne({
          user: createdUser._id,
        });

        await User.deleteOne({
          _id: createdUser._id,
        });
      } catch (cleanupError) {
        console.error(
          "Invited registration cleanup error:",
          cleanupError
        );
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account or membership already exists. Please sign in or contact your administrator.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create your invited account.",
    });
  }
};
