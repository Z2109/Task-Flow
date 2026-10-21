import Notification from "../models/notificationModel.js";


// Create notification
const createNotification = async (req,res) =>{
    try {
        const {recipient,title,message,type,project,task} = req.body;

        if(!recipient || !title || !message || !type){
            return res.status(400).json({
                success: false,
                message:"Recipient, tittle, message and type are required",
            });
        }

        const notification = await Notification.create({
            recipient,
            sender: req.userId,
            title,
            message,
            type,
            project,
            task,
        });

        return res.status(201).json({
            success:true,
            message:"Notification Created Successfully",
            notification,
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
};

//  Get all my notifications

const getNotifications = async (req,res) =>{
    try {
        const notifications = await Notification.find({
            recipient : req.userId,
        })
        .populate("sender","name email")
        .sort({createdAt: -1});

        return res.status(200).json({
            success:true,
            count:notifications.length,
            notifications,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Mark one Notification as Read

const markNotificationAsRead = async (req,res) =>{
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.userId,
        });

        if(!notification){
            return res.status(404).json({
                success:false,
                message:"Notification not found",
            });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({
            success:true,
            message:"Notification marked as read",
            data: notification,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Mark all notification as read

const markedAllNotificationAsRead = async (req,res) =>{
    try {
        const notifications = await Notification.find({
            recipient: req.userId,
            isRead: false,
        });

        for( let i = 0; i < notifications.length; i++){
            notifications[i].isRead = true;
            await notifications[i].save();
        }

        return res.status(200).json({
            success:true,
            message:"All notification marked as read",
            count: notifications.length,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Delete One notification

const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
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
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export {createNotification,getNotifications,markNotificationAsRead,markedAllNotificationAsRead,deleteNotification}