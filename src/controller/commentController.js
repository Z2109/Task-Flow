
import mongoose from "mongoose";
import Comment from "../models/commentModel.js";
import Task from "../models/taskModel.js";
import Project from "../models/projectModel.js";

// Check whether user can access the task

const getAccessibleTask = async (taskId, req) => {
    const task = await Task.findById(taskId);

    if (!task) {
        return { task: null, project: null };
    }

    const project = await Project.findOne({
        _id: task.project,
        organization: req.organizationId,
        $or: [
            { owner: req.userId },
            { members: req.userId },
        ],
    });

    // Allow an assigned user to access their task
    const isAssigned =
        task.assignedTo?.toString() === req.userId.toString();

    if (!project && !isAssigned) {
        return { task: null, project: null };
    }

    // Assigned users must still access tasks within this organization
    if (!project && isAssigned) {
        const assignedProject = await Project.findOne({
            _id: task.project,
            organization: req.organizationId,
        });

        if (!assignedProject) {
            return { task: null, project: null };
        }

        return { task, project: assignedProject };
    }

    return { task, project };
};


// Add a comment

const addcomment = async (req, res) => {
    try {
        const { text } = req.body;
        const { taskId } = req.params;

        if (!mongoose.isValidObjectId(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment text is required",
            });
        }

        if (!req.organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization context is required",
            });
        }

        // Check task access

        const { task } = await getAccessibleTask(taskId, req);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found or access denied",
            });
        }

        // Create comment

        const comment = await Comment.create({
            text: text.trim(),
            task: task._id,
            user: req.userId,
        });

        await comment.populate("user", "name email");

        return res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: comment,
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Get all comments for a task

const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!mongoose.isValidObjectId(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }

        if (!req.organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization context is required",
            });
        }

        // Check task access

        const { task } = await getAccessibleTask(taskId, req);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found or access denied",
            });
        }

        // Get task comments

        const comments = await Comment.find({
            task: task._id,
        })
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: comments.length,
            data: comments,
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Delete your own comment

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        if (!mongoose.isValidObjectId(commentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID",
            });
        }

        if (!req.organizationId) {
            return res.status(400).json({
                success: false,
                message: "Organization context is required",
            });
        }

        // Find comment

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        // Check task access and organization

        const { task } = await getAccessibleTask(
            comment.task.toString(),
            req
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or access denied",
            });
        }

        // Allow users to delete only their own comments

        if (comment.user.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can delete only your own comments",
            });
        }

        await comment.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

 // Update your own comment

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body;

        if (!mongoose.isValidObjectId(commentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID",
            });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment text is required",
            });
        }

        // Find comment

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        // Check task access and organization

        const { task } = await getAccessibleTask(
            comment.task.toString(),
            req
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Comment not found or access denied",
            });
        }

        // Allow users to update only their own comments

        if (comment.user.toString() !== req.userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can update only your own comments",
            });
        }

        comment.text = text.trim();

        await comment.save();

        await comment.populate("user", "name email");

        return res.status(200).json({
            success: true,
            message: "Comment updated successfully",
            data: comment,
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


export {
    addcomment,
    getTaskComments,
    deleteComment,
    updateComment
};
