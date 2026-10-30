import express from "express"

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizePermission from "../middleware/authorizePermission.js";
import { assignProjectRole, assignRole, checkPermission, getUserPermissions, getUserRoles, removeRoleAssignment } from "../controller/roleAssignmentController.js";

const roleAssignmemntRouter = express.Router();

roleAssignmemntRouter.post("/assign",authUser,organizationContext,authorizePermission("role: manage"),assignRole);

roleAssignmemntRouter.get("/user/:userId",authUser,organizationContext,authorizePermission("role:manage"),getUserRoles);

roleAssignmemntRouter.delete("/:assignmentId",authUser,organizationContext,authorizePermission("role:manage"),removeRoleAssignment);

roleAssignmemntRouter.get("/user/:userId/permissions",authUser,organizationContext,authorizePermission("role:manage"),getUserPermissions);

roleAssignmemntRouter.post("/check-permission",authUser,organizationContext,checkPermission);

roleAssignmemntRouter.post("/assign-project-role",authUser,organizationContext,authorizePermission("role:manage"),assignProjectRole);


export default roleAssignmemntRouter