
import express from "express";

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizeProject from "../middleware/authorized.js";

import {
    getAnalyticsOverview,
    getProductivityAnalytics,
    getProjectProgress,
    getTaskStatusAnalytics,
    getProjectOverview,
} from "../controller/analyticsController.js";

const analyticsRouter = express.Router();

// General analytics
analyticsRouter.get(
    "/overview",
    authUser,
    getAnalyticsOverview
);

analyticsRouter.get(
    "/project-progress",
    authUser,
    getProjectProgress
);

analyticsRouter.get(
    "/task-status",
    authUser,
    getTaskStatusAnalytics
);

analyticsRouter.get(
    "/productivity",
    authUser,
    getProductivityAnalytics
);

// Project-specific overview
analyticsRouter.get(
    "/project/:projectId/overview",
    authUser,
    organizationContext,
    authorizeProject,
    getProjectOverview
);

export default analyticsRouter;
