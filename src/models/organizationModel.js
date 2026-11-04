
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Organization subscription details
    billing: {
      plan: {
        type: String,
        enum: ["free", "pro", "business"],
        default: "free",
      },

      billingCycle: {
        type: String,
        enum: ["monthly", "yearly"],
        default: null,
      },

      subscriptionStatus: {
        type: String,
        enum: [
          "free",
          "created",
          "authenticated",
          "active",
          "pending",
          "halted",
          "cancelled",
          "completed",
          "expired",
        ],
        default: "free",
      },

      razorpaySubscriptionId: {
        type: String,
        default: null,
      },

      razorpayPlanId: {
        type: String,
        default: null,
      },

      currentPeriodStart: {
        type: Date,
        default: null,
      },

      currentPeriodEnd: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);

export default Organization;
