
import mongoose from "mongoose";
import Role from "../models/roleModel.js";
import Permission from "../models/permissionModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import RoleAssignment from "../models/roleAssignmentModel.js";
import authorizationService from "../services/authorizationService.js";
import logActivity from "../services/activityLogService.js";
import Project from "../models/projectModel.js";

// Helper: Record activity without failing the main operation
const recordActivity = async (data) => {
    try {
        await logActivity(data);
    } catch (error) {
        console.error("Role Assignment Activity Log Error:", error.message);
    }
};

// Assign organization-level role
const assignRole = async (req, res, next) => {
    try {
        const { userId, roleId } = req.body;
        const organizationId = req.organizationId;
        const grantedBy = req.userId;

        if (!mongoose.isValidObjectId(userId) ||
            !mongoose.isValidObjectId(roleId)) {
            return res.status(400).json({
                success: false,
                message: "Valid user ID and role ID are required",
            });
        }

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required",
            });
        }

        const member = await OrganizationMember.findOne({
            user: userId,
            organization: organizationId,
            status: "active",
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Active organization member not found",
            });
        }

        const role = await Role.findOne({
            _id: roleId,
            organization: organizationId,
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found in this organization",
            });
        }

        if (role.isSystem && role.slug === "owner") {
            return res.status(403).json({
                success: false,
                message: "Owner role cannot be assigned through this API",
            });
        }

        // Prevent duplicate organization-level assignments
        const existingAssignment = await RoleAssignment.findOne({
            user: userId,
            role: roleId,
            organization: organizationId,
            project: null,
        });

        if (existingAssignment) {
            return res.status(409).json({
                success: false,
                message: "This role is already assigned to the user",
            });
        }

        const assignment = await RoleAssignment.create({
            user: userId,
            role: roleId,
            organization: organizationId,
            project: null,
            grantedBy,
        });

        await recordActivity({
            organization: organizationId,
            user: grantedBy,
            action: "ROLE_ASSIGNED",
            entityType: "Role",
            entityId: role._id,
            description: `Role "${role.name}" was assigned to user ${userId}`,
        });

        return res.status(201).json({
            success: true,
            message: "Role assigned successfully",
            data: assignment,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This role is already assigned to the user",
            });
        }

        next(error);
    }
};

// Get a user's assigned roles
const getUserRoles = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const organizationId = req.organizationId;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        const member = await OrganizationMember.findOne({
            user: userId,
            organization: organizationId,
            status: "active",
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Active organization member not found",
            });
        }

        const assignments = await RoleAssignment.find({
            user: userId,
            organization: organizationId,
        })
            .populate({
                path: "role",
                match: { organization: organizationId },
                select: "name slug description scope permissions isSystem",
                populate: {
                    path: "permissions",
                    select: "key resource action",
                },
            })
            .populate("grantedBy", "name email");

        return res.status(200).json({
            success: true,
            count: assignments.filter((item) => item.role).length,
            data: assignments.filter((item) => item.role),
        });
    } catch (error) {
        next(error);
    }
};

// Remove role assignment
const removeRoleAssignment = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const organizationId = req.organizationId;

        if (!mongoose.isValidObjectId(assignmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role assignment ID",
            });
        }

        const assignment = await RoleAssignment.findOne({
            _id: assignmentId,
            organization: organizationId,
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Role assignment not found",
            });
        }

        const role = await Role.findOne({
            _id: assignment.role,
            organization: organizationId,
        });

        if (role && role.slug === "owner") {
            return res.status(403).json({
                success: false,
                message: "Owner role assignment cannot be removed through this API",
            });
        }

        const roleName = role?.name || "Unknown role";
        const assignedUserId = assignment.user;

        await assignment.deleteOne();

        await recordActivity({
            organization: organizationId,
            user: req.userId,
            action: "ROLE_ASSIGNMENT_REMOVED",
            entityType: "Role",
            entityId: assignment.role,
            description: `Role "${roleName}" was removed from user ${assignedUserId}`,
        });

        return res.status(200).json({
            success: true,
            message: "Role assignment removed successfully",
        });
    } catch (error) {
        next(error);
    }
};

// Get a user's effective organization-level permissions
const getUserPermissions = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const organizationId = req.organizationId;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        const member = await OrganizationMember.findOne({
            user: userId,
            organization: organizationId,
            status: "active",
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Active organization member not found",
            });
        }

        const assignments = await RoleAssignment.find({
            user: userId,
            organization: organizationId,
            project: null,
        }).populate({
            path: "role",
            match: { organization: organizationId },
            populate: {
                path: "permissions",
                select: "key resource action description",
            },
        });

        const permissionMap = new Map();

        for (const assignment of assignments) {
            const role = assignment.role;

            if (!role) continue;

            for (const permission of role.permissions || []) {
                permissionMap.set(
                    String(permission._id),
                    permission
                );
            }
        }

        const permissions = Array.from(permissionMap.values());

        return res.status(200).json({
            success: true,
            count: permissions.length,
            data: permissions,
        });
    } catch (error) {
        next(error);
    }
};

// Check whether the logged-in user has a permission
const checkPermission = async (req, res, next) => {
    try {
        const { permission, projectId } = req.body;

        if (!permission || typeof permission !== "string") {
            return res.status(400).json({
                success: false,
                message: "Permission key is required",
            });
        }

        if (projectId && !mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        if (projectId) {
            const project = await Project.findOne({
                _id: projectId,
                organization: req.organizationId,
            });

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found in this organization",
                });
            }
        }

        const allowed = await authorizationService.can({
            userId: req.userId,
            organizationId: req.organizationId,
            projectId: projectId || null,
            permission,
        });

        return res.status(200).json({
            success: true,
            permission,
            allowed,
            message: allowed ? "Permission granted" : "Permission denied",
        });
    } catch (error) {
        next(error);
    }
};

// Assign project-level role
const assignProjectRole = async (req, res, next) => {
    try {
        const { userId, roleId, projectId } = req.body;
        const organizationId = req.organizationId;
        const grantedBy = req.userId;

        if (
            !mongoose.isValidObjectId(userId) ||
            !mongoose.isValidObjectId(roleId) ||
            !mongoose.isValidObjectId(projectId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid user, role, and project IDs are required",
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            organization: organizationId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found in this organization",
            });
        }

        const member = await OrganizationMember.findOne({
            user: userId,
            organization: organizationId,
            status: "active",
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: "Active organization member not found",
            });
        }

        const role = await Role.findOne({
            _id: roleId,
            organization: organizationId,
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found in this organization",
            });
        }

        if (role.slug === "owner") {
            return res.status(403).json({
                success: false,
                message: "Owner role cannot be assigned to a project",
            });
        }

        const existingAssignment = await RoleAssignment.findOne({
            user: userId,
            role: roleId,
            organization: organizationId,
            project: projectId,
        });

        if (existingAssignment) {
            return res.status(409).json({
                success: false,
                message: "This project role is already assigned to the user",
            });
        }

        const assignment = await RoleAssignment.create({
            user: userId,
            role: roleId,
            organization: organizationId,
            project: projectId,
            grantedBy,
        });

        await recordActivity({
            organization: organizationId,
            user: grantedBy,
            action: "PROJECT_ROLE_ASSIGNED",
            entityType: "Role",
            entityId: role._id,
            description: `Role "${role.name}" was assigned to user ${userId} for project "${project.name}"`,
        });

        return res.status(201).json({
            success: true,
            message: "Project role assigned successfully",
            data: assignment,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This project role is already assigned to the user",
            });
        }

        next(error);
    }
};

export {
    assignRole,
    getUserRoles,
    removeRoleAssignment,
    getUserPermissions,
    checkPermission,
    assignProjectRole,
};
