
import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import logActivity from "../services/activityLogService.js";

// Helper: Record activity without failing the project operation
const recordActivity = async (data) => {
    try {
        await logActivity(data);
    } catch (error) {
        console.error("Project activity logging failed:", error.message);
    }
};

// Create Project
const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            color,
            priority,
            dueDate,
            tags,
            coverImage,
            isPrivate,
            reminderEnabled,
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Project name is required!",
            });
        }

        if (!req.organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization context is required",
            });
        }

        const project = await Project.create({
            name: name.trim(),
            description,
            category,
            color,
            priority,
            dueDate,
            tags,
            coverImage,
            isPrivate,
            reminderEnabled,
            owner: req.userId,
            organization: req.organizationId,
        });

        await recordActivity({
            organization: req.organizationId,
            user: req.userId,
            action: "PROJECT_CREATED",
            entityType: "Project",
            entityId: project._id,
            description: `Created project: ${project.name}`,
        });

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        console.error("Create project error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create project",
        });
    }
};

// Get All Projects
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        console.error("Get projects error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch projects",
        });
    }
};

// Get Single Project
const getSingleProject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const project = await Project.findOne({
            _id: id,
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        return res.status(200).json({
            success: true,
            project,
        });
    } catch (error) {
        console.error("Get single project error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch project",
        });
    }
};

// Update Project
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const {
            name,
            description,
            category,
            color,
            priority,
            dueDate,
            tags,
            coverImage,
            isPrivate,
            reminderEnabled,
            status,
        } = req.body;

        const project = await Project.findOne({
            _id: id,
            organization: req.organizationId,
            owner: req.userId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const updates = {
            name,
            description,
            category,
            color,
            priority,
            dueDate,
            tags,
            coverImage,
            isPrivate,
            reminderEnabled,
            status,
        };

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                project[key] = value;
            }
        });

        await project.save();

        await recordActivity({
            organization: req.organizationId,
            user: req.userId,
            action: "PROJECT_UPDATED",
            entityType: "Project",
            entityId: project._id,
            description: `Updated project: ${project.name}`,
        });

        return res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project,
        });
    } catch (error) {
        console.error("Update project error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update project",
        });
    }
};

// Delete Project
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const project = await Project.findOne({
            _id: id,
            organization: req.organizationId,
            owner: req.userId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const projectId = project._id;
        const projectName = project.name;

        await project.deleteOne();

        await recordActivity({
            organization: req.organizationId,
            user: req.userId,
            action: "PROJECT_DELETED",
            entityType: "Project",
            entityId: projectId,
            description: `Deleted project: ${projectName}`,
        });

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
        });
    } catch (error) {
        console.error("Delete project error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete project",
        });
    }
};

// Update Project Status
const updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatus = [
            "Active",
            "Completed",
            "Archived",
        ];

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project status",
            });
        }

        const project = await Project.findOne({
            _id: id,
            organization: req.organizationId,
            owner: req.userId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        const previousStatus = project.status;

        project.status = status;
        await project.save();

        if (previousStatus !== status) {
            await recordActivity({
                organization: req.organizationId,
                user: req.userId,
                action: "PROJECT_STATUS_UPDATED",
                entityType: "Project",
                entityId: project._id,
                description: `Changed project "${project.name}" status from ${previousStatus} to ${status}`,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project status updated successfully",
            project,
        });
    } catch (error) {
        console.error("Update project status error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update project status",
        });
    }
};

// Get Projects By Status
const getProjectsByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const allowedStatus = [
            "Active",
            "Completed",
            "Archived",
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        const projects = await Project.find({
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
            status,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        console.error("Get projects by status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch projects by status",
        });
    }
};

export {
    createProject,
    getProjects,
    getSingleProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    getProjectsByStatus,
};
