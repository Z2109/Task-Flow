
import express from "express";

import {
  getDashboardOverview,
  getMyDashboardTasks,
  getOverdueTasks,
  getProductivitySummary,
  getProjectProgress,
  getProjectStatistics,
  getRecentProjects,
  getRecentTasks,
  getTaskStatistics,
  getUpcomingDeadlines,
} from "../controller/dashboardController.js";

import authUser from "../middleware/auth.js";

const dashboardRouter = express.Router();

// Dashboard overview
dashboardRouter.get("/overview", authUser, getDashboardOverview);

// Recent projects and tasks
dashboardRouter.get("/recent-projects", authUser, getRecentProjects);
dashboardRouter.get("/recent-tasks", authUser, getRecentTasks);

// My tasks
dashboardRouter.get("/my-tasks", authUser, getMyDashboardTasks);

// Deadlines
dashboardRouter.get("/upcoming-deadlines", authUser, getUpcomingDeadlines);
dashboardRouter.get("/overdue-tasks", authUser, getOverdueTasks);

// Statistics
dashboardRouter.get("/task-statistics", authUser, getTaskStatistics);
dashboardRouter.get("/project-statistics", authUser, getProjectStatistics);

// Project progress
dashboardRouter.get("/project-progress", authUser, getProjectProgress);

// Productivity
dashboardRouter.get("/productivity", authUser, getProductivitySummary);

export default dashboardRouter;
