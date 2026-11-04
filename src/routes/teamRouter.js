import express from "express";

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";

import {
    addTeamMember,
    getMyProjects,
    getProjectMembers,
    removeTeamMember,
    getOrganizationMembers,
} from "../controller/teamController.js";

const teamRouter = express.Router();

// Organization team
teamRouter.get(
    "/organization/members",
    authUser,
    organizationContext,
    getOrganizationMembers
);

// Project team
teamRouter.post("/:id/member", authUser, addTeamMember);

teamRouter.get("/:id/members", authUser, getProjectMembers);

teamRouter.get("/my-project", authUser, getMyProjects);

teamRouter.delete(
    "/:id/members/:userId",
    authUser,
    removeTeamMember
);

export default teamRouter;