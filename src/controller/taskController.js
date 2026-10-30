
import mongoose from "mongoose";
import Project from "../models/projectModel.js";
import Task from "../models/taskModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import Notification from "../models/notificationModel.js";
import logActivity from "../services/activityLogService.js";

// Helper: record activity without failing the main task operation
const recordActivity = async (data) => {
    try {
        await logActivity(data);
    } catch (error) {
        console.error("Activity logging failed:", error.message);
    }
};

// Helper: create notification without failing the main task operation
const createTaskNotification = async (data) => {
    try {
        await Notification.create(data);
    } catch (error) {
        console.error("Notification creation failed:", error.message);
    }
};

// Helper: handle common database errors
const handleError = (res, error) => {
    console.error(error);

    if (
        error.name === "CastError" ||
        error.name === "ValidationError"
    ) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};

// Create Task
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            project,
            assignedTo,
            status,
            priority,
            dueDate,
            tags,
            estimatedHours,
            startDate,
        } = req.body;

        if (!title || !project || !assignedTo || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Title, project, assignedTo and dueDate are required",
            });
        }

        if (
            !mongoose.isValidObjectId(project) ||
            !mongoose.isValidObjectId(assignedTo)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project or assigned user ID",
            });
        }

        const existingProject = await Project.findOne({
            _id: project,
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
        });

        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found or access denied",
            });
        }

        const member = await OrganizationMember.findOne({
            user: assignedTo,
            organization: req.organizationId,
            status: "active",
        });

        if (!member) {
            return res.status(400).json({
                success: false,
                message: "Assigned user is not an active organization member",
            });
        }

        const task = await Task.create({
            title,
            description,
            project,
            assignedTo,
            createdBy: req.userId,
            status,
            priority,
            dueDate,
            tags,
            estimatedHours,
            startDate,
        });

        await recordActivity({
            organization: req.organizationId,
            user: req.userId,
            action: "TASK_CREATED",
            entityType: "Task",
            entityId: task._id,
            description: `Created task: ${task.title}`,
        });

        await createTaskNotification({
            recipient: assignedTo,
            sender: req.userId,
            title: "New Task Assigned",
            message: `You have been assigned a task: ${task.title}`,
            type: "Task Assigneed",
            project: task.project,
            task: task._id,
        });

        return res.status(201).json({
            success: true,
            message: "Task created successfully",
            task,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get All Tasks
const getTasks = async (req, res) => {
    try {
        const projects = await Project.find({
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
        }).select("_id");

        const projectIds = projects.map((project) => project._id);

        const tasks = await Task.find({
            project: { $in: projectIds },
        })
            .populate("project", "name color")
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get Single Task
const getSingleTask = async (req, res) => {
    try {
        // authorizedTask middleware loads and authorizes the task.
        return res.status(200).json({
            success: true,
            task: req.task,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Update Task
const updateTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            status,
            priority,
            dueDate,
            tags,
            estimatedHours,
            startDate,
        } = req.body;

        const task = req.task;
        let newAssignee = null;

        // Validate a new assignee if provided.
        if (assignedTo !== undefined) {
            if (!mongoose.isValidObjectId(assignedTo)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assigned user ID",
                });
            }

            const member = await OrganizationMember.findOne({
                user: assignedTo,
                organization: req.organizationId,
                status: "active",
            });

            if (!member) {
                return res.status(400).json({
                    success: false,
                    message: "Assigned user is not an active organization member",
                });
            }

            const previousAssignee = task.assignedTo
                ? task.assignedTo.toString()
                : null;

            if (previousAssignee !== assignedTo.toString()) {
                newAssignee = assignedTo;
            }

            task.assignedTo = assignedTo;
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority !== undefined) task.priority = priority;
        if (status !== undefined) task.status = status;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (tags !== undefined) task.tags = tags;
        if (startDate !== undefined) task.startDate = startDate;

        if (estimatedHours !== undefined) {
            task.estimatedHours = estimatedHours;
        }

        await task.save();

        await recordActivity({
            organization: req.organizationId,
            user: req.userId,
            action: "TASK_UPDATED",
            entityType: "Task",
            entityId: task._id,
            description: `Updated task: ${task.title}`,
        });

        if (newAssignee) {
            await createTaskNotification({
                recipient: newAssignee,
                sender: req.userId,
                title: "New Task Assigned",
                message: `You have been assigned a task: ${task.title}`,
                type: "Task Assigneed",
                project: task.project,
                task: task._id,
            });

            await recordActivity({
                organization: req.organizationId,
                user: req.userId,
                action: "TASK_ASSIGNED",
                entityType: "Task",
                entityId: task._id,
                description: `Assigned task: ${task.title}`,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Delete Task
const deleteTask = async (req, res) => {
    try {
        const task = req.task;

        // Save the task details before deleting it.
        const taskId = task._id;
        const taskTitle = task.title;

        await task.deleteOne();

        await recordActivity({
            organization: req.organizationId,
            user: req.userId,
            action: "TASK_DELETED",
            entityType: "Task",
            entityId: taskId,
            description: `Deleted task: ${taskTitle}`,
        });

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Update Task Status
const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatus = [
            "Todo",
            "In Progress",
            "Review",
            "Completed",
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task status",
            });
        }

        const task = req.task;
        const previousStatus = task.status;

        task.status = status;
        await task.save();

        if (previousStatus !== status) {
            await recordActivity({
                organization: req.organizationId,
                user: req.userId,
                action: "TASK_STATUS_UPDATED",
                entityType: "Task",
                entityId: task._id,
                description: `Changed task "${task.title}" status from ${previousStatus} to ${status}`,
            });

            if (
                task.createdBy &&
                task.createdBy.toString() !== req.userId.toString()
            ) {
                await createTaskNotification({
                    recipient: task.createdBy,
                    sender: req.userId,
                    title: "Task Updated",
                    message: `Task "${task.title}" status changed to ${status}`,
                    type: "Task Updated",
                    project: task.project,
                    task: task._id,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            task,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get My Tasks
const getMyTasks = async (req, res) => {
    try {
        const projects = await Project.find({
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
        }).select("_id");

        const projectIds = projects.map((project) => project._id);

        const tasks = await Task.find({
            project: { $in: projectIds },
            assignedTo: req.userId,
        })
            .populate("project", "name color")
            .populate("createdBy", "name email")
            .sort({ dueDate: 1 });

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get Project Tasks
const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.isValidObjectId(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found or access denied",
            });
        }

        const tasks = await Task.find({
            project: projectId,
        })
            .populate("assignedTo", "name email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get Tasks By Status
const getTasksByStatus = async (req, res) => {
    try {
        const { status } = req.params;

        const allowedStatus = [
            "Todo",
            "In Progress",
            "Review",
            "Completed",
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task status",
            });
        }

        const projects = await Project.find({
            organization: req.organizationId,
            $or: [
                { owner: req.userId },
                { members: req.userId },
            ],
        }).select("_id");

        const projectIds = projects.map((project) => project._id);

        const tasks = await Task.find({
            project: { $in: projectIds },
            status,
        })
            .populate("project", "name color")
            .populate("assignedTo", "name email")
            .sort({ dueDate: 1 });

        return res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Assign Task
const assignTask = async (req, res) => {
    try {
        const { assignedTo } = req.body;

        if (!assignedTo) {
            return res.status(400).json({
                success: false,
                message: "Assigned user is required",
            });
        }

        if (!mongoose.isValidObjectId(assignedTo)) {
            return res.status(400).json({
                success: false,
                message: "Invalid assigned user ID",
            });
        }

        const task = req.task;

        const member = await OrganizationMember.findOne({
            user: assignedTo,
            organization: req.organizationId,
            status: "active",
        });

        if (!member) {
            return res.status(400).json({
                success: false,
                message: "Assigned user is not an active organization member",
            });
        }

        const previousAssignee = task.assignedTo
            ? task.assignedTo.toString()
            : null;

        const assigneeChanged =
            previousAssignee !== assignedTo.toString();

        task.assignedTo = assignedTo;
        await task.save();

        if (assigneeChanged) {
            await recordActivity({
                organization: req.organizationId,
                user: req.userId,
                action: "TASK_ASSIGNED",
                entityType: "Task",
                entityId: task._id,
                description: `Assigned task: ${task.title}`,
            });

            await createTaskNotification({
                recipient: assignedTo,
                sender: req.userId,
                title: "New Task Assigned",
                message: `You have been assigned a task: ${task.title}`,
                type: "Task Assigneed",
                project: task.project,
                task: task._id,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Task assigned successfully",
            task,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Remove Task Assignment
const unassignTask = async (req, res) => {
    try {
        const task = req.task;
        const previousAssignee = task.assignedTo;

        if (!previousAssignee) {
            return res.status(200).json({
                success: true,
                message: "Task is already unassigned",
                task,
            });
        }

        task.assignedTo = null;
        await task.save();

        await recordActivity({
            organization: req.organizationId,
            user: req.userId,
            action: "TASK_UNASSIGNED",
            entityType: "Task",
            entityId: task._id,
            description: `Removed assignment from task: ${task.title}`,
        });

        return res.status(200).json({
            success: true,
            message: "Task unassigned successfully",
            task,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export {
    createTask,
    getTasks,
    getSingleTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getMyTasks,
    getProjectTasks,
    getTasksByStatus,
    assignTask,
    unassignTask,
};
