
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
    try {
      // 1. Validate input
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

      // 2. Check organization
      const organization = await Organization.findOne({
        _id: organizationId,
        isActive: true,
      }).select("_id");

      if (!organization) {
        return false;
      }

      // 3. Check user
      const user = await User.findOne({
        _id: userId,
        isActive: true,
      }).select("_id");

      if (!user) {
        return false;
      }

      // 4. Check active organization membership
      const membership = await OrganizationMember.findOne({
        user: userId,
        organization: organizationId,
        status: "active",
      }).select("_id");

      if (!membership) {
        return false;
      }

      // 5. Validate project when project context exists
      let project = null;

      if (projectId !== null) {
        project = await Project.findOne({
          _id: projectId,
          organization: organizationId,
        }).select("_id owner members");

        if (!project) {
          return false;
        }
      }

      // 6. Find applicable role assignments
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

      if (!assignments.length) {
        return false;
      }

      // 7. Check assigned roles and permissions
      for (const assignment of assignments) {
        const role = assignment.role;

        // Ignore invalid or cross-organization roles
        if (!role) {
          continue;
        }

        const isOrganizationRole =
          assignment.project == null;

        // Organization assignment must have organization scope
        if (isOrganizationRole) {
          if (role.scope !== "organization") {
            continue;
          }
        }

        // Project assignment must have project scope
        if (!isOrganizationRole) {
          if (
            projectId === null ||
            String(assignment.project) !== String(projectId) ||
            role.scope !== "project"
          ) {
            continue;
          }

          // Verify project owner or member
          const isOwner =
            String(project.owner) === String(userId);

          const isMember = (project.members || []).some(
            (memberId) =>
              String(memberId) === String(userId)
          );

          if (!isOwner && !isMember) {
            continue;
          }
        }

        // 8. Compare permission keys
        const rolePermissions = role.permissions || [];

        const hasPermission = rolePermissions.some(
          (item) => item?.key === permission
        );

        if (hasPermission) {
          return true;
        }
      }

      // 9. Deny by default
      return false;

    } catch (error) {
      console.error("Authorization Service Error:", error);

      // Never grant access if authorization fails
      return false;
    }
  },
};

export default authorizationService;
