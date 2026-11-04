
import User from "../models/userModel.js";
import Organization from "../models/organizationModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import Permission from "../models/permissionModel.js";
import Role from "../models/roleModel.js";
import RoleAssignment from "../models/roleAssignmentModel.js";

const createOrganization = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name } = req.body;

    // Validate authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate user
    const user = await User.findById(userId);

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Prevent invited team members from creating their own organization.
const memberships = await OrganizationMember.find({
  user: userId,
  status: { $in: ["invited", "active"] },
}).populate("organization", "owner");

const isTeamMember = memberships.some((membership) => {
  // An outstanding invitation also restricts company creation.
  if (membership.status === "invited") {
    return true;
  }

  const organization = membership.organization;

  return (
    organization &&
    organization.owner.toString() !== userId.toString()
  );
});

if (isTeamMember) {
  return res.status(403).json({
    success: false,
    message: "You are already invited to or a member of an organization. You cannot create a separate company workspace through this account.",
  });
}

    // Generate organization slug
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid organization name",
      });
    }

    // Get seeded permissions
    const permission = await Permission.find({}).select("_id key");

    if (permission.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No permission found. Seed permission first.",
      });
    }

    // Create permission map
    const permissionMap = new Map(
      permission.map((item) => [item.key, item._id])
    );

    // Create organization
    const organization = await Organization.create({
      name: name.trim(),
      slug,
      owner: userId,
    });

    // Add creator as active organization member
    await OrganizationMember.create({
      organization: organization._id,
      user: userId,
      status: "active",
      joinedAt: new Date(),
    });

    // Create Owner role
    const ownerRole = await Role.create({
      name: "Owner",
      slug: "owner",
      description: "Full access to this organization",
      organization: organization._id,
      permissions: permission.map((item) => item._id),
      scope: "organization",
      isSystem: true,
    });

    // Assign Owner role to creator
    await RoleAssignment.create({
      user: userId,
      role: ownerRole._id,
      organization: organization._id,
      project: null,
      grantedBy: userId,
    });

    // Default organization roles
    const defaultRoles = [
      {
        name: "Backend Developer",
        slug: "backend-developer",
        description:
          "Develop and maintain backend features, tasks and project functionality.",
        permissions: [
          "project:read",
          "task:create",
          "task:read",
          "task:update",
          "comment:create",
          "comment:read",
        ],
      },
      {
        name: "UI/UX Designer",
        slug: "ui-ux-designer",
        description:
          "Design user experiences and collaborate on project tasks.",
        permissions: [
          "project:read",
          "task:read",
          "task:update",
          "comment:create",
          "comment:read",
        ],
      },
      {
        name: "Project Manager",
        slug: "project-manager",
        description:
          "Manage projects, tasks and team collaboration.",
        permissions: [
          "project:create",
          "project:read",
          "project:update",
          "project:delete",
          "task:create",
          "task:read",
          "task:update",
          "task:delete",
          "task:assign",
          "comment:create",
          "comment:read",
          "comment:update",
          "comment:delete",
          "member:manage",
          "role:manage",
          "analytics:read",
          "dashboard:read",
        ],
      },
      {
        name: "Viewer",
        slug: "viewer",
        description:
          "View projects, tasks and dashboard information.",
        permissions: [
          "project:read",
          "task:read",
          "comment:read",
          "dashboard:read",
        ],
      },
    ];

    // Validate that every requested permission exists
    const missingPermissions = [
      ...new Set(
        defaultRoles.flatMap((role) =>
          role.permissions.filter(
            (key) => !permissionMap.has(key)
          )
        )
      ),
    ];

    if (missingPermissions.length > 0) {
      throw new Error(
        `Missing seeded permissions: ${missingPermissions.join(", ")}`
      );
    }

    // Prepare default roles
    const rolesToCreate = defaultRoles.map((role) => ({
      name: role.name,
      slug: role.slug,
      description: role.description,
      organization: organization._id,
      permissions: role.permissions.map((key) =>
        permissionMap.get(key)
      ),
      scope: "organization",
      isSystem: true,
    }));

    // Insert default roles
    const createdRoles = await Role.insertMany(rolesToCreate);

    // Success response
    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: {
        organization,
        roles: [ownerRole, ...createdRoles],
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An organization with this slug already exists",
      });
    }

    next(error);
  }
};

// GET: Fetch logged-in user's organization
const getMyOrganization = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const membership = await OrganizationMember.findOne({
      user: userId,
      status: "active",
    }).populate("organization");

    if (!membership || !membership.organization) {
      return res.status(404).json({
        success: false,
        message: "No active organization found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Organization fetched successfully.",
      data: {
        organization: membership.organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  createOrganization,
  getMyOrganization,
};
