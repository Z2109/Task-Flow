
import express from "express";
import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import validateRequest from "../middleware/validateRequest.js";

import {
  createOrganizationSchema,
} from "../validators/organizationValidator.js";

import {
  createOrganization,
  getMyOrganization,
} from "../controller/organizationController.js";

import {
  createSubscription,
} from "../controller/subscriptionController.js";

const organizationRouter = express.Router();

// ======================================
// ORGANIZATION ROUTES
// ======================================

// Create organization
organizationRouter.post(
  "/create",
  authUser,
  validateRequest(createOrganizationSchema),
  createOrganization
);

// Get logged-in user's organization
organizationRouter.get(
  "/my-organization",
  authUser,
  getMyOrganization
);

// ======================================
// RAZORPAY SUBSCRIPTION ROUTES
// ======================================

// Create Razorpay subscription
organizationRouter.post(
  "/billing/subscription",
  authUser,
  organizationContext,
  createSubscription
);

export default organizationRouter;
