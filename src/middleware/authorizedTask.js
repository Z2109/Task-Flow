
import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import Task from "../models/taskModel.js";

const authorizedTask = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const organizationId = req.organizationId;

        // 1. Check authentication
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // 2. Validate task ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }

        // 3. Check organization context
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization context is required",
            });
        }

        // 4. Find task
        const task = await Task.findById(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found",
            });
        }

        // 5. Find project within the current organization
        const project = await Project.findOne({
            _id: task.project,
            organization: organizationId,
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project associated with this task not found",
            });
        }

        // 6. Check project owner
        const isOwner =
            String(project.owner) === String(userId);

        // 7. Check project membership
        const isTeamMember = (project.members || []).some(
            (member) => String(member) === String(userId)
        );

        // 8. Check task assignment
        const isAssigned =
            task.assignedTo != null &&
            String(task.assignedTo) === String(userId);

        // 9. Deny access if user has no relationship to the task
        if (!isOwner && !isTeamMember && !isAssigned) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are not authorized to access this task",
            });
        }

        // 10. Attach verified resources to the request
        req.task = task;
        req.project = project;
        req.projectId = project._id.toString();

        return next();
    } catch (error) {
        return next(error);
    }
};

export default authorizedTask;
