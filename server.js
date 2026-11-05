
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
import aiRouter from "./src/routes/aiRoutes.js";

const app = express();

const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (Postman/server requests).
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow API is running",
  });
});

// Environment checks
console.log("MongoDB URL loaded:", Boolean(process.env.MONGODB_URL));
console.log("Cloudinary configured:", Boolean(process.env.CLOUDINARY_CLOUD_NAME));

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
app.use("/api/users", userRouter);
app.use("/api/ai", aiRouter);

// Unknown routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handler
app.use(errorMiddleware);

// Start server only after database connection
const startServer = async () => {
  try {
    await connectToDb();

    app.listen(PORT, () => {
      console.log(`TaskFlow server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start TaskFlow server:", error.message);
    process.exit(1);
  }
};

startServer();
