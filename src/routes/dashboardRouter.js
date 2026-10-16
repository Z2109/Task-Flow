import express from "express"
import { getDashboardOverview, getMyDashboardTasks, getOverdueTasks, getProductivitySummary, getProjectProgress, getProjectStatistics, getRecentProjects, getRecentTasks, getTaskStatistics, getUpcomingDeadlines } from "../controller/dashboardController.js"
import authUser from "../middleware/auth.js"

const dashboardRouter = express.Router();

dashboardRouter.get("/overview",authUser,getDashboardOverview);
dashboardRouter.get("/recent-projects",authUser,getRecentProjects);
dashboardRouter.get("/recent-tasks",authUser,getRecentTasks);
dashboardRouter.get("/my-tasks",authUser,getMyDashboardTasks);
dashboardRouter.get("/upcoming-deadlines",authUser,getUpcomingDeadlines);
dashboardRouter.get("/overdue-tasks",authUser,getOverdueTasks);
dashboardRouter.get("/task-statistics",authUser,getTaskStatistics);
dashboardRouter.get("/project-progress",authUser, getProjectProgress);
dashboardRouter.get("productivity",authUser,getProductivitySummary);
dashboardRouter.get("project-statistics",authUser,getProjectStatistics)




export default dashboardRouter