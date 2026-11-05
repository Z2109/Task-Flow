import express from "express";
import authUser from "../middleware/auth.js";
import { chatWithAI } from "../controller/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/chat", authUser, chatWithAI);

export default aiRouter;