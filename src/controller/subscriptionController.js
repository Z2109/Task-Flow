
import mongoose from "mongoose";
import Organization from "../models/organizationModel.js";
import razorpay from "../config/razorpay.js";

const planIdMap = {
  pro: {
    monthly: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
    yearly: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID,
  },
  business: {
    monthly: process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID,
    yearly: process.env.RAZORPAY_BUSINESS_YEARLY_PLAN_ID,
  },
};

export const createSubscription = async (req, res) => {
  try {
    const { plan, billingCycle } = req.body;

    // Validate selected plan
    if (!["pro", "business"].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid paid plan.",
      });
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid billing cycle.",
      });
    }

    // Organization context middleware should set this.
    const organizationId = req.organizationId;

    if (!organizationId || !mongoose.isValidObjectId(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid organization context is required.",
      });
    }

    const organization = await Organization.findById(organizationId);

    if (!organization || !organization.isActive) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or inactive.",
      });
    }

    // Only the organization owner can purchase a plan.
    if (organization.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the organization owner can manage billing.",
      });
    }

    // Do not create duplicate subscriptions for an active organization.
    if (
      organization.billing?.subscriptionStatus === "active"
    ) {
      return res.status(409).json({
        success: false,
        message: "Your organization already has an active subscription.",
      });
    }

    const razorpayPlanId = planIdMap[plan][billingCycle];

    if (!razorpayPlanId) {
      return res.status(503).json({
        success: false,
        message: "Razorpay plan ID is not configured for this plan.",
      });
    }

    // Razorpay requires a total number of billing cycles.
    const totalCount =
      billingCycle === "monthly" ? 1200 : 100;

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: true,
      notes: {
        organizationId: organization._id.toString(),
        organizationName: organization.name,
        selectedPlan: plan,
        billingCycle,
      },
    });

    // Store pending details. Do not activate the paid plan here.
    organization.billing = {
      ...organization.billing?.toObject?.(),
      plan: organization.billing?.plan || "free",
      billingCycle,
      subscriptionStatus: "created",
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };

    await organization.save();

    return res.status(201).json({
      success: true,
      message: "Subscription created. Continue to Razorpay Checkout.",
      data: {
        subscriptionId: subscription.id,
        razorpayPlanId: subscription.plan_id,
        status: subscription.status,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan,
        billingCycle,
      },
    });
  } catch (error) {
    console.error("Create subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create subscription.",
    });
  }
};
