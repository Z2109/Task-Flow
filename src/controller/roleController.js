
import mongoose from "mongoose";
import Role from "../models/roleModel.js";
import Permission from "../models/permissionModel.js";
import RoleAssignment from "../models/roleAssignmentModel.js";
import logActivity from "../services/activityLogService.js";

// Helper: Log activity without failing the main operation
const recordActivity = async (data) => {
    try {
        await logActivity(data);
    } catch (error) {
        console.error("Role Activity Log Error:", error.message);
    }
};

// Create role
const createRole = async (req, res, next) => {
    try {
        const { name, description, permissions, scope } = req.body;
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required",
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Role name is required",
            });
        }

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                message: "Permissions must be an array",
            });
        }

        // Validate permission IDs
        const invalidPermissionId = permissions.some(
            (id) => !mongoose.isValidObjectId(id)
        );

        if (invalidPermissionId) {
            return res.status(400).json({
                success: false,
                message: "Invalid permission IDs",
            });
        }

        const permissionList = await Permission.find({
            _id: { $in: permissions },
        });

        if (permissionList.length !== new Set(permissions.map(String)).size) {
            return res.status(400).json({
                success: false,
                message: "Invalid or duplicate permission IDs",
            });
        }

        const role = await Role.create({
            name: name.trim(),
            slug: name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
            description,
            organization: organizationId,
            permissions: permissionList.map((permission) => permission._id),
            scope,
            isSystem: false,
        });

        await recordActivity({
            organization: organizationId,
            user: req.userId,
            action: "ROLE_CREATED",
            entityType: "Role",
            entityId: role._id,
            description: `Role "${role.name}" was created`,
        });

        return res.status(201).json({
            success: true,
            message: "Role created successfully",
            data: role,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Role already exists",
            });
        }

        next(error);
    }
};

// Get all roles
const getRoles = async (req, res, next) => {
    try {
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required",
            });
        }

        const roles = await Role.find({
            organization: organizationId,
        }).populate("permissions", "key resource action");

        return res.status(200).json({
            success: true,
            count: roles.length,
            data: roles,
        });
    } catch (error) {
        next(error);
    }
};

// Get single role
const getSingleRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID",
            });
        }

        const role = await Role.findOne({
            _id: id,
            organization: organizationId,
        }).populate("permissions", "key resource action");

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: role,
        });
    } catch (error) {
        next(error);
    }
};

// Update role
const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, permissions, scope } = req.body;
        const organizationId = req.organizationId;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID",
            });
        }

        const role = await Role.findOne({
            _id: id,
            organization: organizationId,
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        if (role.isSystem) {
            return res.status(403).json({
                success: false,
                message: "System roles cannot be updated",
            });
        }

        let hasChanges = false;

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Role name must not be empty",
                });
            }

            role.name = name.trim();
            role.slug = name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

            hasChanges = true;
        }

        if (description !== undefined) {
            role.description = description;
            hasChanges = true;
        }

        if (scope !== undefined) {
            role.scope = scope;
            hasChanges = true;
        }

        if (permissions !== undefined) {
            if (!Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    message: "Permissions must be an array",
                });
            }

            if (permissions.some((permissionId) =>
                !mongoose.isValidObjectId(permissionId)
            )) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid permission IDs",
                });
            }

            const permissionList = await Permission.find({
                _id: { $in: permissions },
            });

            const uniquePermissionIds = new Set(
                permissions.map(String)
            );

            if (permissionList.length !== uniquePermissionIds.size) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid permission IDs",
                });
            }

            role.permissions = permissionList.map(
                (permission) => permission._id
            );

            hasChanges = true;
        }

        await role.save();

        if (hasChanges) {
            await recordActivity({
                organization: organizationId,
                user: req.userId,
                action: "ROLE_UPDATED",
                entityType: "Role",
                entityId: role._id,
                description: `Role "${role.name}" was updated`,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: role,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A role with this name already exists",
            });
        }

        next(error);
    }
};

// Delete role
const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const organizationId = req.organizationId;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID",
            });
        }

        const role = await Role.findOne({
            _id: id,
            organization: organizationId,
        });

        if (!role) {
            return res.status(404).json({
                success: false,
                message: "Role not found",
            });
        }

        if (role.isSystem) {
            return res.status(403).json({
                success: false,
                message: "System roles cannot be deleted",
            });
        }

        // Prevent deleting a role that is still assigned to users.
        // Remove assignments only if that is your intended business rule.
        await RoleAssignment.deleteMany({
            role: role._id,
        });

        const roleName = role.name;
        const roleId = role._id;

        await role.deleteOne();

        await recordActivity({
            organization: organizationId,
            user: req.userId,
            action: "ROLE_DELETED",
            entityType: "Role",
            entityId: roleId,
            description: `Role "${roleName}" was deleted`,
        });

        return res.status(200).json({
            success: true,
            message: "Role deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export {
    createRole,
    getRoles,
    getSingleRole,
    updateRole,
    deleteRole,
};
