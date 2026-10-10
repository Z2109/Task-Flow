import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true,
        },

        description:{
            type:String,
            trim:true,
        },

        category:{
            type:String,
            trim:true,
        },

        color:{
            type:String,
            default:"#6366F1",
        },

        priority:{
            type:String,
            enum:["Low","Medium","High"],
            default:"Medium",
        },

        dueDate:{
            type:Date,
        },

        tags:[
            {
                type:String,
                trim:true,
            },
        ],

        coverImage:{
            type:String,
            default: "",
        },

        isPrivate:{
            type:Boolean,
            default:false,
        },
        
        reminderEnabled:{
            type:Boolean,
            default:false,
        },

        owner:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true,
        },

        status:{
            type:String,
            enum:["Active","Completed","Archived"],
            default:"Active",
        },

        createdAt:{
            type:Date,
            default:Date.now,
        },

    },
    {
        timestamps:true,
    }

);

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;