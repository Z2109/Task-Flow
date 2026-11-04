
import express from "express";


import organizationContext from "../middleware/organizationContext.js";
import authUser from "../middleware/auth.js";
import authorizeProject from "../middleware/authorized.js";
import upload from "../middleware/uploadMiddleware.js";

import {
    uploadProjectFile,
    getProjectFiles,
    deleteProjectFile,
} from "../controller/fileController.js";

const fileRouter = express.Router();

// Upload a file
fileRouter.post(
    "/project/:projectId/upload",
    authUser,
    organizationContext,
    authorizeProject,
    upload.single("file"),
    uploadProjectFile
);

// Get all project files
fileRouter.get(
    "/project/:projectId",
    authUser,
    organizationContext,
    authorizeProject,
    getProjectFiles
);

// Delete a project file
fileRouter.delete(
    "/project/:projectId/:fileId",
    authUser,
    organizationContext,
    authorizeProject,
    deleteProjectFile
);

export default fileRouter;
