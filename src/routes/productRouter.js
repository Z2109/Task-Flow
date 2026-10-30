
import express from "express";

import {
    createProject,
    deleteProject,
    getProjects,
    getProjectsByStatus,
    getSingleProject,
    updateProject,
    updateProjectStatus
} from "../controller/productController.js";

import validateRequest from "../middleware/validateRequest.js";
import authUser from "../middleware/auth.js";
import authorizeProject from "../middleware/authorized.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizePermission from "../middleware/authorizePermission.js";
import { createProjectValidator, updateProjectValidator } from "../validators/projectValidator.js";

const productRouter = express.Router();

productRouter.post(
    "/create",
    authUser,
    organizationContext,
    authorizePermission("project:create"),
    validateRequest(createProjectValidator),
    createProject
);

productRouter.get(
    "/list",
    authUser,
    organizationContext,
    authorizePermission("project:read"),
    getProjects
);

productRouter.get(
    "/status/:status",
    authUser,
    organizationContext,
    authorizePermission("project:read"),
    getProjectsByStatus
);

productRouter.get(
    "/:id",
    authUser,
    organizationContext,
    authorizePermission("project:read"),
    getSingleProject
);

productRouter.put(
    "/:id",
    authUser,
    organizationContext,
    authorizeProject,
    authorizePermission("project:update"),
    validateRequest(updateProjectValidator),
    updateProject
);

productRouter.delete(
    "/:id",
    authUser,
    organizationContext,
    authorizePermission("project:delete"),
    authorizeProject,
    deleteProject
);

productRouter.patch(
    "/:id/status",
    authUser,
    organizationContext,
    authorizePermission("project:update"),
    authorizeProject,
    updateProjectStatus
);

export default productRouter;
