
import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import Organization from "../models/organizationModel.js";
import User from "../models/userModel.js";
import logActivity from "../services/activityLogService.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import RoleAssignment from "../models/roleAssignmentModel.js";

// Helper: Record activity without failing the main operation
const recordActivity = async (data) => {
    try {
        await logActivity(data);
    } catch (error) {
        console.error("Activity Log Error:", error.message);
    }
};

// Add team member to project
const addTeamMember = async (req, res) => {
    try {
        const { userId } = req.body;
        const projectId = req.params.id;

        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        if (!userId || !mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "A valid user ID is required",
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Only the project owner can add members
        if (String(project.owner) !== String(req.userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to manage this project",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (String(project.owner) === String(user._id)) {
            return res.status(400).json({
                success: false,
                message: "Project owner is already part of the project",
            });
        }

        const alreadyMember = project.members.some(
            (member) => String(member) === String(user._id)
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: "User is already a project member",
            });
        }

        // Save member
        project.members.push(user._id);
        await project.save();

        // Record activity
        await recordActivity({
            organization: req.organizationId || project.organization,
            user: req.userId,
            action: "MEMBER_ADDED",
            entityType: "Member",
            entityId: user._id,
            description: `${user.name} was added to project "${project.name}"`,
        });

        return res.status(200).json({
            success: true,
            message: "Team member added successfully",
            project,
        });
    } catch (error) {
        console.error("Add Team Member Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add team member",
        });
    }
};

// Get project members
const getProjectMembers = async (req, res) => {
    try {
        const projectId = req.params.id;

        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const project = await Project.findById(projectId)
            .populate("owner", "name email")
            .populate("members", "name email");

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const isOwner =
            project.owner &&
            String(project.owner._id) === String(req.userId);

        const isMember = project.members.some(
            (member) => String(member._id) === String(req.userId)
        );

        if (!isOwner && !isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this project",
            });
        }

        return res.status(200).json({
            success: true,
            owner: project.owner,
            totalMembers: project.members.length,
            members: project.members,
        });
    } catch (error) {
        console.error("Get Project Members Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch project members",
        });
    }
};

// Get projects owned by or assigned to the logged-in user
const getMyProjects = async (req, res) => {
    try {
        const userId = req.userId;

        const ownedProjects = await Project.find({
            owner: userId,
        }).populate("owner", "name email");

        const memberProjects = await Project.find({
            members: userId,
        }).populate("owner", "name email");

        const projects = [...ownedProjects];

        memberProjects.forEach((project) => {
            const alreadyExists = projects.some(
                (item) => String(item._id) === String(project._id)
            );

            if (!alreadyExists) {
                projects.push(project);
            }
        });

        return res.status(200).json({
            success: true,
            totalProjects: projects.length,
            projects,
        });
    } catch (error) {
        console.error("Get My Projects Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch your projects",
        });
    }
};

// Remove team member
const removeTeamMember = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.params.userId;

        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        if (String(project.owner) !== String(req.userId)) {
            return res.status(403).json({
                success: false,
                message: "Only the project owner can remove members",
            });
        }

        const memberExists = project.members.some(
            (member) => String(member) === String(userId)
        );

        if (!memberExists) {
            return res.status(404).json({
                success: false,
                message: "Team member not found in this project",
            });
        }

        const user = await User.findById(userId);

        project.members = project.members.filter(
            (member) => String(member) !== String(userId)
        );

        await project.save();

        // Record activity
        await recordActivity({
            organization: req.organizationId || project.organization,
            user: req.userId,
            action: "MEMBER_REMOVED",
            entityType: "Member",
            entityId: userId,
            description: `${user?.name || "A user"} was removed from project "${project.name}"`,
        });

        return res.status(200).json({
            success: true,
            message: "Team member removed successfully",
            members: project.members,
        });
    } catch (error) {
        console.error("Remove Team Member Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove team member",
        });
    }
};

// Get all members of the current organization


const getOrganizationMembers = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization ID is required",
            });
        }

        // Step 1: Get organization and its actual owner
        const organization = await Organization.findById(
            organizationId
        ).select("owner");

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found",
            });
        }

        const ownerId = String(organization.owner);

        // Step 2: Get active organization memberships
        const memberships = await OrganizationMember.find({
            organization: organizationId,
            status: "active",
            user: { $ne: organization.owner },
        })
            .populate(
                "user",
                "name email avatar jobTitle department"
            )
            .sort({ createdAt: -1 })
            .lean();

        // Step 3: Get organization-level role assignments
        const assignments = await RoleAssignment.find({
            organization: organizationId,
            project: null,
        })
            .populate("role", "name")
            .lean();

        // Step 4: Map roles against user IDs
        const roleMap = {};

        assignments.forEach((assignment) => {
            const userId = String(assignment.user);

            if (!roleMap[userId]) {
                roleMap[userId] = [];
            }

            if (assignment.role?.name) {
                roleMap[userId].push(assignment.role.name);
            }
        });

        // Step 5: Format employee list
        const teamMembers = memberships
            .filter((membership) => {
                if (!membership.user) return false;

                // Always exclude the actual organization owner
                return String(membership.user._id) !== ownerId;
            })
            .map((membership) => {
                const user = membership.user;
                const userId = String(user._id);
                const roles = roleMap[userId] || [];

                return {
                    _id: user._id,
                    userId: user._id,
                    membershipId: membership._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar || "",
                    jobTitle: user.jobTitle || "Team Member",
                    department: user.department || "General",
                    status: membership.status,
                    roles,
                    roleLabel: roles.join(", ") || "Member",
                };
            });

        // Step 6: Send response
        return res.status(200).json({
            success: true,
            message: "Organization members fetched successfully",
            statistics: {
                total: teamMembers.length,
                active: teamMembers.length,
            },
            members: teamMembers,
        });

    } catch (error) {
        console.error("Get Organization Members Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch organization members",
        });
    }
};


export {
    addTeamMember,
    getProjectMembers,
    getMyProjects,
    removeTeamMember,
    getOrganizationMembers
};
