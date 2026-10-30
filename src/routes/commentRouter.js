
import express from "express";

import {
    addcomment,
    getTaskComments,
    deleteComment,
    updateComment,
} from "../controller/commentController.js";

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizePermission from "../middleware/authorizePermission.js";

const commentRouter = express.Router();

commentRouter.post(
    "/task/:taskId",
    authUser,
    organizationContext,
    authorizePermission("comment:create"),
    addcomment
);

commentRouter.get(
    "/task/:taskId",
    authUser,
    organizationContext,
    authorizePermission("comment:read"),
    getTaskComments
);

commentRouter.delete(
    "/:commentId",
    authUser,
    organizationContext,
    deleteComment
);

commentRouter.put(
    "/:commentId",
    authUser,
    organizationContext,
    updateComment
);

export default commentRouter;
