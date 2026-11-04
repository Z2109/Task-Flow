
import "./src/config/loadEnv.js";

import express from "express";
import cors from "cors";

import connectToDb from "./src/config/db.js";

import userRouter from "./src/routes/userRouter.js";
import productRouter from "./src/routes/productRouter.js";
import taskRouter from "./src/routes/taskRouter.js";
import dashboardRouter from "./src/routes/dashboardRouter.js";
import analyticsRouter from "./src/routes/analyticsRouter.js";
import commentRouter from "./src/routes/commentRouter.js";
import notificationRouter from "./src/routes/notificationRouter.js";
import teamRouter from "./src/routes/teamRouter.js";
import organiationRouter from "./src/routes/organizationRoutes.js";
import roleRouter from "./src/routes/roleRoutes.js";
import roleAssignmemntRouter from "./src/routes/roleAssignmentRouter.js";
import errorMiddleware from "./src/middleware/errorHandling.js";
import activityLogRouter from "./src/routes/activityLogRouter.js";
import invitationRouter from "./src/routes/invitationRouter.js";
import fileRouter from "./src/routes/fileRoutes.js";
import permissionRouter from "./src/routes/permissionRoutes.js";


const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Environment check
console.log("MongoDB URL loaded:", Boolean(process.env.MONGODB_URL));
console.log("Cloudinary configured:", Boolean(process.env.CLOUDINARY_CLOUD_NAME));

// Database
connectToDb();

// API routes
app.use("/api/user", userRouter);
app.use("/api/projects", productRouter);
app.use("/api/task", taskRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/comment", commentRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/team", teamRouter);
app.use("/api/organizations", organiationRouter);
app.use("/api/roles", roleRouter);
app.use("/api/role-assignments", roleAssignmemntRouter);
app.use("/api/activity-logs", activityLogRouter);
app.use("/api/invitations", invitationRouter);
app.use("/api/files", fileRouter);
app.use("/api/permissions", permissionRouter);
app.use("/api/users", userRouter); // this is for settings


// Unknown routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handler
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
