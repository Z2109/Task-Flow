import Permission from "../models/permissionModel.js";
import authorizationService from "../services/authorizationService.js";
import RoleAssignment from "../models/roleAssignmentModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import Organization from "../models/organizationModel.js";
import User from "../models/userModel.js";

const getMyPermissions = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.organizationId;

    // Verify active user
    const user = await User.findById(userId).select(
      "_id name email isActive"
    );

    if (!user || user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "User is inactive or not found",
      });
    }

    // Verify active organization
    const organization = await Organization.findOne({
      _id: organizationId,
      isActive: true,
    }).select("_id name");

    if (!organization) {
      return res.status(403).json({
        success: false,
        message: "Organization not found or inactive",
      });
    }

    // Verify membership
    const membership = await OrganizationMember.findOne({
      user: userId,
      organization: organizationId,
      status: "active",
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You are not an active member",
      });
    }

    // Get organization-level role assignments
    const assignments = await RoleAssignment.find({
      user: userId,
      organization: organizationId,
      project: null,
    }).populate({
      path: "role",
      match: {
        organization: organizationId,
        scope: "organization",
      },
      populate: {
        path: "permissions",
        select: "key resource action",
      },
    });

    // Collect unique permissions
    const permissionSet = new Set();
    const roles = [];

    for (const assignment of assignments) {
      if (!assignment.role) continue;

      roles.push({
        id: assignment.role._id,
        name: assignment.role.name,
        slug: assignment.role.slug,
        scope: assignment.role.scope,
      });

      for (const permission of assignment.role.permissions || []) {
        if (permission?.key) {
          permissionSet.add(permission.key);
        }
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      organization: {
        id: organization._id,
        name: organization.name,
      },
      roles,
      permissions: Array.from(permissionSet),
    });
  } catch (error) {
    console.error("Get My Permissions Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch permissions",
    });
  }
};


const getPermissionsList = async (req, res) => {
  try {
    const userId = req.userId;
    const organizationId = req.organizationId;

    // Only users who can manage roles can access
    // the available permissions list.
    const allowed = await authorizationService.can({
      userId,
      organizationId,
      permission: "role:manage",
    });

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view available permissions.",
      });
    }

    const permissions = await Permission.find({})
      .select("_id key resource action description")
      .sort({ resource: 1, action: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      permissions,
      data: permissions,
    });
  } catch (error) {
    console.error("Get Permissions List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch available permissions.",
    });
  }
};




export { getMyPermissions,getPermissionsList };
