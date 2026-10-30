import express from "express";
import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizePermission from "../middleware/authorizePermission.js";
import { createRoleSchema } from "../validators/roleValidator.js";
import validateRequest from "../middleware/validateRequest.js";
import { createRole, deleteRole, getRoles, getSingleRole, updateRole } from "../controller/roleController.js";

const roleRouter = express.Router();

roleRouter.post("/create",authUser,organizationContext,authorizePermission("role:manage"),validateRequest(createRoleSchema),createRole);
roleRouter.get("/list",authUser,organizationContext,authorizePermission("role:manage"),getRoles);
roleRouter.get("/:id",authUser,organizationContext,authorizePermission("role:manage"),getSingleRole);
roleRouter.put("/:id",authUser,organizationContext,authorizePermission("role:manage"),updateRole);
roleRouter.delete("/:id",authUser,organizationContext,authorizePermission("role:manage"),deleteRole);

export default roleRouter;