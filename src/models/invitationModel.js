import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tokenHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "revoked"],
      default: "pending",
      index: true,
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple pending invitations for the same email
// within the same organization.
invitationSchema.index(
  { organization: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

// Automatically delete expired invitation documents after expiry.
invitationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const Invitation =
  mongoose.models.Invitation ||
  mongoose.model("Invitation", invitationSchema);

export default Invitation;