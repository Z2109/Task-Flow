import mongoose from "mongoose"

const organizationMemberSchema = new mongoose.Schema(
    {
        organization:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },

        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true,
        },

        status: {
            type: String,
            enum: ["invited", "active", "suspended"],
            default: "invited",
        },

        joinedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

organizationMemberSchema.index(
  { organization: 1, user: 1 },
  { unique: true }
);

const OrganizationMember =
  mongoose.models.OrganizationMember ||
  mongoose.model("OrganizationMember", organizationMemberSchema);

export default OrganizationMember;