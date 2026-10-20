import express from "express";
import authUser from "../middleware/auth.js";
import { addcomment, deleteComment, getTaskComments } from "../controller/commentController.js";



const commentRouter = express.Router();

commentRouter.post("/:taskId",authUser,addcomment);
commentRouter.get("/:taskId",authUser,getTaskComments);
commentRouter.delete("/delete/:commentId",authUser,deleteComment);

export default commentRouter;