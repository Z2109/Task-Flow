
import mongoose from "mongoose";

import User from "../models/userModel.js";
import Organization from "../models/organizationModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import RoleAssignment from "../models/roleAssignmentModel.js";
import Project from "../models/projectModel.js";

const authorizationService = {
    async can({
        userId,
        organizationId,
        projectId = null,
        permission,
    }) {
        // 1. Validate inputs
        if (
            !mongoose.isValidObjectId(userId) ||
            !mongoose.isValidObjectId(organizationId) ||
            typeof permission !== "string" ||
            !permission.trim()
        ) {
            return false;
        }

        if (
            projectId !== null &&
            !mongoose.isValidObjectId(projectId)
        ) {
            return false;
        }

        // 2. Verify the organization is active
        const organization = await Organization.findOne({
            _id: organizationId,
            isActive: true,
        }).select("_id");

        if (!organization) return false;

        // 3. Verify the user is active
        const user = await User.findById(userId).select(
            "_id isActive"
        );

        if (!user || user.isActive === false) return false;

        // 4. Verify active organization membership
        const membership = await OrganizationMember.findOne({
            user: userId,
            organization: organizationId,
            status: "active",
        }).select("_id");

        if (!membership) return false;

        // 5. Verify project organization and project membership
        let project = null;

        if (projectId !== null) {
            project = await Project.findOne({
                _id: projectId,
                organization: organizationId,
            }).select("_id owner members");

            if (!project) return false;
        }

        // 6. Load organization-level and applicable project-level roles
        const assignmentQuery = {
            user: userId,
            organization: organizationId,
            $or: [{ project: null }],
        };

        if (projectId !== null) {
            assignmentQuery.$or.push({
                project: projectId,
            });
        }

        const assignments = await RoleAssignment.find(
            assignmentQuery
        ).populate({
            path: "role",
            match: {
                organization: organizationId,
            },
            populate: {
                path: "permissions",
                select: "key",
            },
        });

        // 7. Evaluate applicable permissions
        for (const assignment of assignments) {
            const role = assignment.role;

            // Ignore missing or cross-organization roles
            if (!role) continue;

            const isOrganizationAssignment =
                assignment.project == null;

            // Organization roles must have organization scope
            if (
                isOrganizationAssignment &&
                role.scope !== "organization"
            ) {
                continue;
            }

            // Project roles must match the requested project and scope
            if (!isOrganizationAssignment) {
                if (
                    projectId === null ||
                    String(assignment.project) !== String(projectId) ||
                    role.scope !== "project"
                ) {
                    continue;
                }

                // Only the project owner or a project member can
                // use project-level role permissions.
                const isOwner =
                    String(project.owner) === String(userId);

                const isMember = (project.members || []).some(
                    (memberId) => String(memberId) === String(userId)
                );

                if (!isOwner && !isMember) {
                    continue;
                }
            }

            const permissions = role.permissions || [];

            const hasPermission = permissions.some(
                (item) => item.key === permission
            );

            if (hasPermission) {
                return true;
            }
        }

        // 8. Deny by default
        return false;
    },
};

export default authorizationService;
