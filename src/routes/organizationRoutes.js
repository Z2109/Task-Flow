import express from "express"
import authUser from "../middleware/auth.js";
import validateRequest from "../middleware/validateRequest.js";
import { createOrganizationSchema } from "../validators/organizationValidator.js";
import { createOrganization } from "../controller/organizationController.js";

const organiationRouter = express.Router();

organiationRouter.post("/create",authUser,validateRequest(createOrganizationSchema),createOrganization);

export default organiationRouter;