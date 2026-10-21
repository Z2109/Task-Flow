import express from "express"
import authUser from "../middleware/auth.js"
import { addTeamMember, getMyProjects, getProjectMembers, removeTeamMember } from "../controller/teamController.js";

const teamRouter = express.Router();

teamRouter.post("/:id/member",authUser,addTeamMember);
teamRouter.get("/:id/members",authUser,getProjectMembers);
teamRouter.get("/my-project",authUser,getMyProjects);
teamRouter.delete("/:id/members/:userId",authUser,removeTeamMember);

export default teamRouter;