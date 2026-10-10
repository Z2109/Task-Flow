import Project from "../models/projectModel.js";
import Task from "../models/taskModel.js"

// create Task

const createTask = async(req,res) =>{

    try {
        const{
            title,decription,project,assignedTo,status,priority,dueDate,tags,estimatedHours,startDate,
        } = req.body;

        if(!title || !project || !assignedTo || !dueDate){
            return res.status(400).json({
                success:false,
                message:"Title, project, assignedTo and dueDate are required"
            });
        }

        // check project

        const existingProject = await Project.findOne({
            _id:project,
            owner: req.userId,
        });

        if(!existingProject){
            return res.status(404).json({
                success:true,
                message:"Project not found"
            });
        }

        // create task

        const task = await Task.create({
            title,decription,project,assignedTo,createdBy:req.userId,status,priority,dueDate,tags,estimatedHours,startDate,
        });

        res.status(201).json({
            success:true,
            message:"Task Created Successfully", task,
        });
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};


// Get all tasks

const getTasks = async (req,res) => {
    try {
        const tasks = await Task.find({
            createdBy: req.userId,
        })
        .populate("project","name color")
        .populate("assignedTo","name email")
        .sort({createdAt: -1});

        res.json({
            success:true,
            tasks,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// get single task

const getTaskbyId = async (req,res) => {
    try {
        const {id} = req.params;

        const task = await Task.findOne({
            _id:id,
            createdBy:req.userId,
        })
        .populate("project","name color")
        .populate("assignedTo","name email");

        if(!task){
            return res.status(404).json({
                success:false,
                message:"Task not found",
            });
        }

        res.json({
            success:true,
            task,
        });
    } catch (error) {
        console.log(error)

        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// Update task

const updateTask = async (req,res) =>{
    try {
        const {id} = req.params;

        const{
            title,decription,project,assignedTo,status,priority,dueDate,tags,estimatedHours,startDate,
        } = req.body;

        const task = await Task.findOne({
            _id:id,
            createdBy: req.userId,
        });

        if(!task){
            return res.status(404).json({
                success:false,
                message:"Task not found",
            });
        } 
        // update only feild that were provided
        if(title !== undefined){
            task.title = title;
        }
        if(description !== undefined){
            task.description = description;
        }
        if(project !== undefined){
            task.project = project;
        }
        if(assignedTo !== undefined){
            task.assignedTo = assignedTo;
        }
        if(priority !== undefined){
            task.priority = priority;
        }
        if(status !== undefined){
            task.status = status;
        

        //  set completedAt when task is completed

        if(status === "Completed"){
            task.completedAt = new Date();
        }else{
            task.completedAt = null;
        }
    }

    if(dueDate !== undefined){
        task.dueDate = dueDate;
    }
    if(tags !== undefined){
        task.tags = tags;
    }
    if(startDate !== undefined){
        task.startDate = startDate;
    }
    if(estimatedHours !== undefined){
        task.estimatedHours = estimatedHours;
    }

    await task.save();

    res.json({
        success:true,
        message:"Task updated successfully",
        task,
    });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// delete task

const deleteTask = async(req,res) => {
    try {
        const {id} = req.params;

        const task = await Task.findOneAndDelete({
            _id:id,
            createdBy: req.userId,
        });

        if(!task){
            return res.status(404).json({
                success:false,
                message:"Task not found",
            });
        }

        res.json({
            success:true,
            message:"Task deleted successfully",
        });
    } catch (error) {
        console.log(error)

        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// update task status

const updateTaskStatus = async (req,res) =>{
    try {
        const {id} = req.params;
        const {status} = req.body;

        const allowedStatus = [
            "Todo",
            "In Progress",
            "Completed",
        ];

        if(!allowedStatus.includes(status)){
            return res.status(400).json({
                success:false,
                message:"Invalid Task Status"
            });
        }

        const updateStatus = {
            status,
        };

        if(status === "Completed"){
            updateData.completedAt = new Date();
        }else{
            updateData.completedAt = null;
        }

        const task = await Task.findOneAndUpdate(
            {
                _id:id,
                createdBy:req.userId,
            },
            updateData,
            {
                new:true,
            }
        );

        if(!task){
            return res.status(404).json({
                success:false,
                message:"Task not found",
            });
        }

        res.json({
            success:true,
            message:"Task status updated successfully",
            task,
        });

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// get my tasks

const getMyTasks = async (req,res) => {
    try {
        const tasks = await Task.find({
            assignedTo:req.userId,
        })

        .populate("project","name color")
        .populate("createdBy","name email")
        .sort({dueDate: 1})

        res.json({
            success:true,
            tasks,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};

// get project tasks

const getProjectTasks = async (req,res) =>{
    try {
        const {projectId} = req.params;

        const tasks = await Task.find({
            project: projectId,
        })
        .populate("assignedTo","name color")
        .populate("createdBy","name email")
        .sort({createdAt: -1});

        res.json({
            success:true,
            tasks,
        })
    } catch (error) {
        console.log(error);

        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// get task by status

const getTasksByStatus = async (req,res) =>{
    try {
        const {status} = req.params;

        const allowedStatus = [
            "Todo",
            "In Progress",
            "Completed",
        ];

        if(!allowedStatus.includes(status)){
            return res.status(400).json({
                success:false,
                message:"Invalid Task Status"
            });
        }

        const tasks = await Task.find({
            createdBy : req.userId,
            status,
        })

        .populate("project","name color")
        .populate("assingedTo","name email")
        .sort({dueDate: 1});

        res.json({
            success:true,
            tasks,
        });
    } catch (error) {
        console.log(error);
        
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

export {createTask,getTasks,getTaskbyId,updateTask,deleteTask,updateTaskStatus,getMyTasks,getProjectTasks,getTasksByStatus}