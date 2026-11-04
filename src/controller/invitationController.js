
import crypto from "crypto";
import mongoose from "mongoose";

import Invitation from "../models/invitationModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import Role from "../models/roleModel.js";
import User from "../models/userModel.js";
import Organization from "../models/organizationModel.js";
import RoleAssignment from "../models/roleAssignmentModel.js";

import authorizationService from "../services/authorizationService.js";
import sendEmail from "../utils/emailService.js";

// Generate a secure invitation token
const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash token before saving it in the database
const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

// Escape HTML values before inserting them into an email
const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

// Check whether user has permission to manage members
const checkMemberPermission = async (userId, organizationId) => {
  return await authorizationService.can({
    userId,
    organizationId,
    permission: "member:manage",
  });
};

// =====================================================
// CREATE INVITATIONS
// POST: /api/invitations/create
// =====================================================

export const createInvitations = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.organizationId;
    const { invitations } = req.body;

    if (!userId || !organizationId) {
      return res.status(400).json({
        success: false,
        message: "User or organization context is missing.",
      });
    }

    if (!mongoose.isValidObjectId(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID.",
      });
    }

    if (!Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one invitation.",
      });
    }

    if (invitations.length > 20) {
      return res.status(400).json({
        success: false,
        message: "You can send a maximum of 20 invitations at once.",
      });
    }

    // Verify active organization membership
    const membership = await OrganizationMember.findOne({
      organization: organizationId,
      user: userId,
      status: "active",
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not an active member of this organization.",
      });
    }

    // Check RBAC permission
    const hasPermission = await checkMemberPermission(
      userId,
      organizationId
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to invite members.",
      });
    }

    // Get organization and inviter details
    const [organization, inviter] = await Promise.all([
      Organization.findById(organizationId).select("name"),
      User.findById(userId).select("name email"),
    ]);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    // Normalize invitation data
    const normalizedInvitations = invitations.map((item) => ({
      email: item.email?.trim().toLowerCase(),
      roleId: item.roleId,
    }));

    const invalidInvitation = normalizedInvitations.find(
      (item) =>
        !item.email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email) ||
        !mongoose.isValidObjectId(item.roleId)
    );

    if (invalidInvitation) {
      return res.status(400).json({
        success: false,
        message: "Every invitation needs a valid email and role ID.",
      });
    }

    // Prevent duplicate emails in the same request
    const emails = normalizedInvitations.map((item) => item.email);

    if (new Set(emails).size !== emails.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate email addresses are not allowed.",
      });
    }

    // Find existing users
    const existingUsers = await User.find({
      email: { $in: emails },
    }).select("_id email");

    const existingUserMap = new Map(
      existingUsers.map((user) => [
        user.email.toLowerCase(),
        user,
      ])
    );

    const results = [];

    // Process invitations individually
    for (const item of normalizedInvitations) {
      try {
        const existingUser = existingUserMap.get(item.email);

        // Prevent inviting an active organization member
        if (existingUser) {
          const activeMember = await OrganizationMember.findOne({
            organization: organizationId,
            user: existingUser._id,
            status: "active",
          });

          if (activeMember) {
            results.push({
              email: item.email,
              success: false,
              message: "This user is already a member of your organization.",
            });

            continue;
          }
        }

        // Verify role belongs to this organization
        const role = await Role.findOne({
          _id: item.roleId,
          organization: organizationId,
          scope: "organization",
        });

        if (!role) {
          results.push({
            email: item.email,
            success: false,
            message: "Invalid organization role selected.",
          });

          continue;
        }

        // Find an existing pending invitation
        const existingInvitation = await Invitation.findOne({
          organization: organizationId,
          email: item.email,
          status: "pending",
        });

        // Expire older invitation
        if (existingInvitation) {
          existingInvitation.status = "expired";
          await existingInvitation.save();
        }

        // Generate secure token
        const rawToken = generateInvitationToken();
        const tokenHash = hashToken(rawToken);

        const expiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        // Save invitation in MongoDB
        const invitation = await Invitation.create({
          organization: organizationId,
          email: item.email,
          role: role._id,
          invitedBy: userId,
          tokenHash,
          expiresAt,
        });

        // Get frontend URL
        const frontendUrl = process.env.FRONTEND_URL?.trim();

        if (!frontendUrl) {
          await Invitation.deleteOne({
            _id: invitation._id,
          });

          throw new Error(
            "FRONTEND_URL is missing from Backend/.env"
          );
        }

        // Build acceptance URL
        const invitationUrl =
  `${frontendUrl.replace(/\/$/, "")}/join-team?token=${encodeURIComponent(rawToken)}`;

        // Prepare safe email content
        const safeOrganizationName = escapeHtml(organization.name);
        const safeRoleName = escapeHtml(role.name);
        const safeInviterName = escapeHtml(
          inviter?.name || "Your organization administrator"
        );
        const safeInvitationUrl = escapeHtml(invitationUrl);

        const emailHtml = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:35px;color:#20243a;background:#ffffff;">

    <div style="text-align:center;margin-bottom:25px;">
      <h1 style="color:#5145ec;margin-bottom:5px;">TaskFlow</h1>
      <p style="color:#667085;font-size:13px;">Plan better. Work smarter.</p>
    </div>

    <h2 style="color:#20243a;">Welcome to TaskFlow by ${safeOrganizationName}!</h2>

    <p>Hello,</p>

    <p>
      ${safeInviterName} has added you to
      <strong>${safeOrganizationName}</strong> on TaskFlow.
    </p>

    <p>
      Your assigned role:
      <strong>${safeRoleName}</strong>
    </p>

    <p>
      Create your account or sign in with your existing TaskFlow
      account to join your organization.
    </p>

    <div style="text-align:center;margin:30px 0;">
      <a href="${safeInvitationUrl}"
         style="background:#5145ec;color:#ffffff;text-decoration:none;padding:15px 30px;border-radius:9px;display:inline-block;font-weight:bold;">
        Sign Up / Join TaskFlow
      </a>
    </div>

    <p style="font-size:13px;color:#667085;">
      This link expires in 7 days and can only be used by the invited email address.
    </p>

    <p style="font-size:13px;color:#667085;">
      If you were not expecting this email, you can safely ignore it.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0;"/>

    <p style="text-align:center;font-size:12px;color:#98a2b3;">
      © TaskFlow | Acme Technologies
    </p>

  </div>
`;

        // Send invitation email
        try {
          const emailInfo = await sendEmail({
            to: item.email,
            subject: `You're invited to join ${organization.name} on TaskFlow`,
            html: emailHtml,
          });

          results.push({
            email: item.email,
            invitationId: invitation._id,
            success: true,
            emailSent: true,
            messageId: emailInfo.messageId,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
          });

        } catch (emailError) {
          await Invitation.deleteOne({
            _id: invitation._id,
          });

          console.error(
            `Invitation email failed for ${item.email}:`,
            {
              message: emailError.message,
              code: emailError.code,
              responseCode: emailError.responseCode,
            }
          );

          results.push({
            email: item.email,
            success: false,
            emailSent: false,
            message:
              "Invitation was not sent. Please check the email configuration and try again.",
          });
        }

      } catch (itemError) {
        if (itemError.code === 11000) {
          results.push({
            email: item.email,
            success: false,
            message: "A pending invitation already exists.",
          });

          continue;
        }

        console.error(
          `Invitation error for ${item.email}:`,
          itemError
        );

        results.push({
          email: item.email,
          success: false,
          message: itemError.message || "Failed to create invitation.",
        });
      }
    }

    // Prepare final response
    const successful = results.filter((item) => item.success);
    const failed = results.filter((item) => !item.success);

    return res.status(successful.length > 0 ? 201 : 400).json({
      success: successful.length > 0,

      message:
        successful.length > 0
          ? `${successful.length} invitation email(s) sent successfully.`
          : "No invitation emails were sent. Check the individual errors.",

      summary: {
        total: invitations.length,
        successful: successful.length,
        failed: failed.length,
        emailsSent: successful.filter((item) => item.emailSent).length,
      },

      results,
    });

  } catch (error) {
    console.error("Create invitations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create invitations.",
    });
  }
};


// =====================================================
// VALIDATE INVITATION
// GET: /api/invitations/validate/:token
// =====================================================

export const validateInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).json({
        success: false,
        message: "This invitation link is invalid.",
      });
    }

    const tokenHash = hashToken(token);

    const invitation = await Invitation.findOne({
      tokenHash,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("organization", "name")
      .populate("role", "name description")
      .populate("invitedBy", "name email");

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "This invitation is invalid, expired, or has already been used.",
      });
    }

    return res.status(200).json({
      success: true,
      invitation: {
        email: invitation.email,
        organization: invitation.organization,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
      },
    });

  } catch (error) {
    console.error("Validate invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to validate this invitation.",
    });
  }
};


// =====================================================
// ACCEPT INVITATION
// POST: /api/invitations/accept/:token
// =====================================================

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please sign in or create an account before accepting this invitation.",
      });
    }

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).json({
        success: false,
        message: "This invitation link is invalid.",
      });
    }

    const tokenHash = hashToken(token);

    const invitation = await Invitation.findOne({
      tokenHash,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "This invitation is invalid, expired, or has already been used.",
      });
    }

    const [user, organization, role] = await Promise.all([
      User.findById(userId).select("name email isActive"),

      Organization.findById(invitation.organization).select(
        "name isActive"
      ),

      Role.findOne({
        _id: invitation.role,
        organization: invitation.organization,
        scope: "organization",
      }).select("name"),
    ]);

    if (!user || user.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Your user account could not be found or is inactive.",
      });
    }

    // Ensure logged-in email matches invitation email
    if (
      user.email.trim().toLowerCase() !==
      invitation.email.trim().toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: `This invitation was sent to ${invitation.email}. Please sign in with that email address.`,
      });
    }

    if (
      !organization ||
      organization.isActive === false ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "The organization or assigned role is no longer available.",
      });
    }

    // Check existing membership
    const existingMembership = await OrganizationMember.findOne({
      organization: invitation.organization,
      user: user._id,
    });

    if (existingMembership?.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your membership in this organization is suspended. Contact an organization administrator.",
      });
    }

    // Create or activate organization membership
    await OrganizationMember.findOneAndUpdate(
      {
        organization: invitation.organization,
        user: user._id,
      },
      {
        $set: {
          status: "active",
          joinedAt: existingMembership?.joinedAt || new Date(),
        },
        $setOnInsert: {
          organization: invitation.organization,
          user: user._id,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Assign the role selected by the inviter
    await RoleAssignment.findOneAndUpdate(
      {
        user: user._id,
        organization: invitation.organization,
        project: null,
      },
      {
        $set: {
          role: invitation.role,
          grantedBy: invitation.invitedBy,
        },
        $setOnInsert: {
          user: user._id,
          organization: invitation.organization,
          project: null,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Mark invitation as accepted
    const acceptedInvitation = await Invitation.findOneAndUpdate(
      {
        _id: invitation._id,
        status: "pending",
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          status: "accepted",
          acceptedBy: user._id,
          acceptedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!acceptedInvitation) {
      return res.status(409).json({
        success: false,
        message: "This invitation has already been accepted or is no longer valid.",
      });
    }

    // Send welcome email after membership is saved
    let welcomeEmailSent = false;

    try {
      const safeName = escapeHtml(user.name || "there");
      const safeOrganizationName = escapeHtml(organization.name);
      const safeRoleName = escapeHtml(role.name);

      const frontendUrl = process.env.FRONTEND_URL
        ?.trim()
        ?.replace(/\/$/, "");

      const dashboardUrl = frontendUrl
        ? `${frontendUrl}/dashboard`
        : "";

      await sendEmail({
        to: user.email,
        subject: `Welcome to ${organization.name} on TaskFlow!`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#20243a;">

            <h1 style="color:#5145ec;">
              Welcome to TaskFlow!
            </h1>

            <p>Hi ${safeName},</p>

            <p>
              You are now officially a member of
              <strong>${safeOrganizationName}</strong>.
            </p>

            <p>
              Your role is
              <strong>${safeRoleName}</strong>.
            </p>

            <p>
              You can now collaborate with your team,
              work on projects, and manage your assigned tasks.
            </p>

            ${
              dashboardUrl
                ? `
                  <p>
                    <a
                      href="${escapeHtml(dashboardUrl)}"
                      style="display:inline-block;padding:12px 20px;background:#5145ec;color:#fff;text-decoration:none;border-radius:8px;"
                    >
                      Open TaskFlow
                    </a>
                  </p>
                `
                : ""
            }

            <p>We're glad to have you on the team!</p>

            <p>— The TaskFlow Team</p>

          </div>
        `,
      });

      welcomeEmailSent = true;

    } catch (emailError) {
      console.error("Welcome email failed:", {
        message: emailError.message,
        code: emailError.code,
        responseCode: emailError.responseCode,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Welcome to the team! Your invitation has been accepted.",
      welcomeEmailSent,

      organization: {
        id: organization._id,
        name: organization.name,
      },

      membership: {
        status: "active",
        joinedAt: new Date(),
      },

      role: {
        id: role._id,
        name: role.name,
      },
    });

  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to accept this invitation. Please try again.",
    });
  }
};


// =====================================================
// GET ORGANIZATION INVITATIONS
// GET: /api/invitations/list
// =====================================================

export const getInvitations = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.organizationId;

    if (!userId || !organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization context is missing.",
      });
    }

    // Check permission before viewing invitations
    const hasPermission = await checkMemberPermission(
      userId,
      organizationId
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view invitations.",
      });
    }

    const invitations = await Invitation.find({
      organization: organizationId,
    })
      .select("-tokenHash")
      .populate("role", "name description")
      .populate("invitedBy", "name email")
      .populate("acceptedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });

  } catch (error) {
    console.error("Get invitations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invitations.",
    });
  }
};


// GET: /api/invitations/preview/:token
export const getInvitationPreview = async (req, res) => {
  try {
    const { token } = req.params;

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation link.",
      });
    }

    const invitation = await Invitation.findOne({
      tokenHash: hashToken(token),
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .select("+tokenHash")
      .populate("organization", "name isActive")
      .populate("role", "name description")
      .populate("invitedBy", "name");

    if (!invitation) {
      return res.status(404).json({
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

    return res.status(200).json({
      success: true,
      invitation: {
        email: invitation.email,
        organizationName: invitation.organization.name,
        roleName: invitation.role.name,
        invitedBy: invitation.invitedBy?.name || "Your team administrator",
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Invitation preview error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify this invitation.",
    });
  }
};

