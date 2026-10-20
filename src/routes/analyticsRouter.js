
import express from "express";
import authUser from "../middleware/auth.js";
import { getAnalyticsOverview, getProductivityAnalytics, getProjectProgress, getTaskStatusAnalytics } from "../controller/analyticsController.js";

const analyticsRouter = express.Router();

analyticsRouter.get("/overview",authUser,getAnalyticsOverview);
analyticsRouter.get("/project-progress",authUser,getProjectProgress);
analyticsRouter.get("/task-status",authUser,getTaskStatusAnalytics);
analyticsRouter.get("/productivity",authUser,getProductivityAnalytics);

export default analyticsRouter;
