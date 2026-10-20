
import Comment from "../models/commentModel.js";
import Task from "../models/taskModel.js";

// Add a comment
const addcomment = async (req,res) =>{
    try {
        const {text} = req.body;
        const {taskId} = req.params;

        if(!text || !text.trim()){
            return res.status(400).json({
                success:false,
                message:"Comment text is required",
            });
        }
        const task = await Task.findById(taskId);

        if(!task){
            return res.status(404).json({
                success:false,
                message: "Task not found",
            });
        }

        const comment = await Comment.create({
            text: text.trim(),
            task: taskId,
            user: req.userId,
        });

        await comment.populate("user","name email");

        return res.status(201).json({
            success:true,
            message: "Comment added successfully",
            data: comment,
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
};

//  Get all comments for a task

const getTaskComments = async (req,res) =>{
    try {
        const {taskId} = req.params;

        const task = await Task.findById(taskId);

        if(!task){
            return res.status(404).json({
                success:false,
                message:"Task not found",
            });
        }

        const comments = await Comment.find({
            task: taskId,
        })

        .populate("user","name email")
        .sort({ createdAt: -1});

        return res.status(200).json({
            success: true,
            count: comments.length,
            data: comments,
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
}

// Delete your own comment

const deleteComment = async (req,res) =>{
    try {
        const {commentId} = req.params;

        const comment = await Comment.findById(commentId);

        if(!comment){
            return res.status(404).json({
                success:false,
                message: "Comment not found",
            });
        }

        if(comment.user.toString() !== req.userId.toString()){
            return res.status(403).json({
                success:false,
                message:"You can delete only your own comments",
            });
        } 

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            success:true,
            message:"Comment deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
};

export {addcomment ,getTaskComments ,deleteComment}