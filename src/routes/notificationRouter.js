import express from "express"
import authUser from "../middleware/auth.js";
import { createNotification, deleteNotification, getNotifications, markedAllNotificationAsRead, markNotificationAsRead } from "../controller/notificationController.js";


const notificationRouter = express.Router();

notificationRouter.post("/create",authUser,createNotification);
notificationRouter.get("/list",authUser,getNotifications);
notificationRouter.patch("/:id/read", authUser, markNotificationAsRead);
notificationRouter.patch("/read-all",authUser,markedAllNotificationAsRead);
notificationRouter.delete("/:id",authUser,deleteNotification);


export default notificationRouter;