
import express from "express";

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizePermission from "../middleware/authorizePermission.js";

import { getActivityLogs } from "../controller/activityLogController.js";

const activityLogRouter = express.Router();

activityLogRouter.get(
    "/",
    authUser,
    organizationContext,
    authorizePermission("analytics:read"),
    getActivityLogs
);

export default activityLogRouter;
