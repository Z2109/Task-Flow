
import express from "express";

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizePermission from "../middleware/authorizePermission.js";

import {
  getMyPermissions,
  getPermissionsList,
} from "../controller/permissionController.js";

const permissionRouter = express.Router();

// Current user's effective organization permissions
permissionRouter.get(
  "/my-permissions",
  authUser,
  organizationContext,
  getMyPermissions
);

// Available permissions for role configuration
permissionRouter.get(
  "/list",
  authUser,
  organizationContext,
  authorizePermission("role:manage"),
  getPermissionsList
);

export default permissionRouter;
