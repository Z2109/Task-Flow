
import mongoose from "mongoose";

import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import OrganizationMember from "../models/organizationMemberModel.js";
import Project from "../models/projectModel.js";

// Create Notification

const createNotification = async (req, res) => {
    try {
        const {
            recipient,
            title,
            message,
            type,
            project,
            task,
        } = req.body;

        if (!recipient || !title?.trim() || !message?.trim() || !type) {
            return res.status(400).json({
                success: false,
                message: "Recipient, title, message and type are required",
            });
        }

        if (!mongoose.isValidObjectId(recipient)) {
            return res.status(400).json({
                success: false,
                message: "Invalid recipient ID",
            });
        }

        if (
            project &&
            !mongoose.isValidObjectId(project)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        if (
            task &&
            !mongoose.isValidObjectId(task)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }

        const allowedTypes = [
            "Task Assigneed",
            "Task Updated",
            "Comment",
            "Project Updated",
            "Reminder",
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification type",
            });
        }

        // Check recipient exists and is active
        const user = await User.findById(recipient);

        if (!user || user.isActive === false) {
            return res.status(404).json({
                success: false,
                message: "Recipient not found or inactive",
            });
        }

        // Check recipient belongs to the current organization
        const membership = await OrganizationMember.findOne({
            user: recipient,
            organization: req.organizationId,
            status: "active",
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "Recipient is not an active organization member",
            });
        }

        // If project is supplied, verify it belongs to this organization
        if (project) {
            const existingProject = await Project.findOne({
                _id: project,
                organization: req.organizationId,
            });

            if (!existingProject) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found in this organization",
                });
            }
        }

        const notification = await Notification.create({
            recipient,
            sender: req.userId,
            title: title.trim(),
            message: message.trim(),
            type,
            project: project || undefined,
            task: task || undefined,
        });

        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            notification,
        });

    } catch (error) {
        console.error("Create notification error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create notification",
        });
    }
};


// Get My Notifications

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.userId,
        })
            .populate("sender", "name email")
            .populate("project", "name color")
            .populate("task", "title status")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount: notifications.filter(
                (notification) => !notification.isRead
            ).length,
            notifications,
        });

    } catch (error) {
        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
};


// Mark One Notification As Read

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID",
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                recipient: req.userId,
            },
            {
                $set: { isRead: true },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification,
        });

    } catch (error) {
        console.error("Mark notification as read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
        });
    }
};


// Mark All Notifications As Read

const markedAllNotificationAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                recipient: req.userId,
                isRead: false,
            },
            {
                $set: { isRead: true },
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            count: result.modifiedCount,
        });

    } catch (error) {
        console.error("Mark all notifications as read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
        });
    }
};


// Delete One Notification

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID",
            });
        }

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: req.userId,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });

    } catch (error) {
        console.error("Delete notification error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete notification",
        });
    }
};


export {
    createNotification,
    getNotifications,
    markNotificationAsRead,
    markedAllNotificationAsRead,
    deleteNotification,
};
