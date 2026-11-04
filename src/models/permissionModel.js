import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
    {
        key:{
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },

        resource:{
            type: String,
            required: true,
        },

        action:{
            type: String,
            required: true,
        },

        description:{
            type: String,
            default:"",
        },
    },
    {
        timestamps: true,
    },
);

const Permission =
  mongoose.models.Permission ||
  mongoose.model("Permission", permissionSchema);

export default Permission;