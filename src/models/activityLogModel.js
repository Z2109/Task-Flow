
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        action: {
            type: String,
            required: true,
            trim: true,
        },

        entityType: {
            type: String,
            enum: [
                "Project",
                "Task",
                "Comment",
                "Member",
                "Role",
            ],
            required: true,
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const ActivityLog =
    mongoose.models.ActivityLog ||
    mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;
