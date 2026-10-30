
import express from "express";

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizePermission from "../middleware/authorizePermission.js";

import {
    createNotification,
    deleteNotification,
    getNotifications,
    markedAllNotificationAsRead,
    markNotificationAsRead,
} from "../controller/notificationController.js";

const notificationRouter = express.Router();

// Create notification
notificationRouter.post(
    "/create",
    authUser,
    organizationContext,
    authorizePermission("notification:create"),
    createNotification
);

// Get my notifications
notificationRouter.get(
    "/list",
    authUser,
    organizationContext,
    getNotifications
);

// Mark one notification as read
notificationRouter.patch(
    "/:id/read",
    authUser,
    organizationContext,
    markNotificationAsRead
);

// Mark all notifications as read
notificationRouter.patch(
    "/read-all",
    authUser,
    organizationContext,
    markedAllNotificationAsRead
);

// Delete one notification
notificationRouter.delete(
    "/:id",
    authUser,
    organizationContext,
    deleteNotification
);

export default notificationRouter;
