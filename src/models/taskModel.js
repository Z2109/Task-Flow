import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        title:{
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type:String,
            trim: true,
            default:"",
        },

        project:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Project",
            required:true,
        },

        assignedTo:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },

        createdBy: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },

        status:{
            type:String,
            enum:[
                "Todo",
                "In Progress",
                "Review",
                "Completed",
            ],
            default:"Todo",
        },

        priority:{
            type:String,
            enum:["Low","Medium","High"],
            default:"Medium",
        },

        startDate:{
            type:Date,
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

        estimatedHours:{
            type:Number,
            min:0,
            default:0,
        },

        attachments:[
            {
                name:String,
                url:String,
            },
        ],
    },
    {
        timestamps:true,
    }
);

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;