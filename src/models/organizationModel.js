import mongoose from "mongoose"

const organizationSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            trim: true,
        },

        slug:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true,
        },

        isActive:{
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);

export default Organization;