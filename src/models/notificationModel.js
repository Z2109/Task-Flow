import mongoose, { mongo } from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true,
        },
        sender:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        title:{
            type: String,
            required: true,
        },

        message:{
            type:String,
            required: true,
        },

        type:{
            type: String,
            enum:[
                "Task Assigneed",
                "Task Updated",
                "Comment",
                "Project Updated",
                "Reminder",
            ],
            required: true,
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },

        task:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
        },

        isRead:{
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.models.Notification || mongoose.model("NotificationSchema",notificationSchema);

export default Notification;