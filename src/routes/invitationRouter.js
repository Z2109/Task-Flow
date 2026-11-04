import express from "express";

import {
    createInvitations,
    getInvitations,
    validateInvitation,
    acceptInvitation,
} from "../controller/invitationController.js";

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";

const invitationRouter = express.Router();

// Public: validate the secure signup link
invitationRouter.get(
    "/validate/:token",
    validateInvitation
);

// Authenticated: add an existing TaskFlow user to the organization
invitationRouter.post(
    "/accept/:token",
    authUser,
    acceptInvitation
);

// Organization-protected routes
invitationRouter.post(
    "/create",
    authUser,
    organizationContext,
    createInvitations
);

invitationRouter.get(
    "/list",
    authUser,
    organizationContext,
    getInvitations
);

export default invitationRouter;