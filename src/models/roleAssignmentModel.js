import mongoose from "mongoose"

const roleAssignmentSchema = new mongoose.Schema(
    {
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true,
        },

        role:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Role",
            required: true,
        },

        organization:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Organization",
            required: true,
        },

        project:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Project",
            default:null,
        },

        grantedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        },
    },
    {
        timestamps: true,
    }
);

roleAssignmentSchema.index({
  user: 1,
  organization: 1,
  project: 1,
});

const RoleAssignment =
  mongoose.models.RoleAssignment ||
  mongoose.model("RoleAssignment", roleAssignmentSchema);

export default RoleAssignment;
    