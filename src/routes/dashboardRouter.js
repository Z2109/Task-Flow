import express from "express"
import { getDashboardOverview, getRecentProjects } from "../controller/dashboardController.js"
import authUser from "../middleware/auth.js"

const dashboardRouter = express.Router();

dashboardRouter.get("/overview",authUser,getDashboardOverview);
dashboardRouter.get("/recent-projects",authUser,getRecentProjects);



export default dashboardRouter