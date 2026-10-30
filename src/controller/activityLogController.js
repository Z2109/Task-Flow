
import mongoose from "mongoose";
import ActivityLog from "../models/activityLogModel.js";

const getActivityLogs = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(req.query.limit) || 20)
        );

        const filter = {
            organization: req.organizationId,
        };

        if (req.query.entityType) {
            const allowedTypes = [
                "Project",
                "Task",
                "Comment",
                "Member",
                "Role",
            ];

            if (!allowedTypes.includes(req.query.entityType)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid entityType",
                });
            }

            filter.entityType = req.query.entityType;
        }

        if (req.query.userId) {
            if (!mongoose.isValidObjectId(req.query.userId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID",
                });
            }

            filter.user = req.query.userId;
        }

        const [logs, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate("user", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),

            ActivityLog.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            logs,
        });
    } catch (error) {
        console.error("Get activity logs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch activity logs",
        });
    }
};

export { getActivityLogs };
