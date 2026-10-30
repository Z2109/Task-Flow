import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.join(__dirname, ".env"),
});
console.log("EMAIL_USER loaded:", Boolean(process.env.EMAIL_USER));
console.log("EMAIL_PASS loaded:", Boolean(process.env.EMAIL_PASS));
console.log("CLIENT_URL loaded:", Boolean(process.env.CLIENT_URL));

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



const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Check environment variable
console.log("MongoDB URL loaded:", !!process.env.MONGODB_URL);

// Connect MongoDB
connectToDb();





// Api end points
app.use('/api/user',userRouter)
app.use('/api/project',productRouter)
app.use('/api/task',taskRouter)
app.use('/api/dashboard',dashboardRouter)
app.use('/api/analytics',analyticsRouter)
app.use('/api/comment',commentRouter)
app.use('/api/notification',notificationRouter)
app.use('/api/team',teamRouter)
app.use('/api/organizations',organiationRouter)
app.use("/api/roles", roleRouter);
app.use("/api/role-assignments",roleAssignmemntRouter)
app.use("/api/activity-logs", activityLogRouter);

// Handle unknown routes
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// Centralized error handler — must be last
app.use(errorMiddleware);





// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});