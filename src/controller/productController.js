import Project from "../models/projectModel.js";

// Create Project
const createProject = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            color,
            priority,
            dueDate,
            tags,
            coverImage,
            isPrivate,
            reminderEnabled,
        } = req.body;

        // Validate project name
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Project name is required!",
            });
        }

        // Create project
        const project = await Project.create({
            name,
            description,
            category,
            color,
            priority,
            dueDate,
            tags,
            coverImage,
            isPrivate,
            reminderEnabled,

            // Logged-in user
            owner: req.userId,
        });

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Get All Project

const getProjects = async (req,res) => {
    try{
        const projects = await Project.find({
            owner:req.userId,
        }).sort({createdAt:-1});

        res.json({success:true,projects,})

    }catch(error){
        console.log(error);

        res.status(500).json({
            success:false,message:error.message,
        });
    }
};


// Get a Single Project

const getSingleProject = async (req,res) =>{
    try{

        const {id} = req.params;

        const project = await Project.findOne({
            _id: id,
            owner: req.userId,
        });

        if(!project) {
            return res.status(404).json({
                success:false,
                message:"Project not found",
            });
        }

        res.json({
            success:true,
            project,
        });
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// Update projects

const updateProject = async (req,res) => {
    try{

        const {id} = req.params;

        const {
            name,
            description,
            category,
            color,
            priority,
            dueDate,
            tags,
            coverImage,
            isPrivate,
            reminderEnabled,
            status,
        } = req.body;

        const project = await Project.findOne({
            _id:id,
            owner: req.userId,
        });

        if(!project){
            return res.status(404).json({
                success:false,
                message:"Project not found",
            });
        }

        // update only provided fields

        const updates = {
            name,
            description,
            category,
            color,
            priority,
            dueDate,
            tags,
            coverImage,
            isPrivate,
            reminderEnabled,
            status,
        };

        Object.entries(updates).forEach(
            ([key, value]) => {
                if(value != undefined)
                    project[key] = value;
            });

            await project.save();

            res.status(200).json({
                success:true,
                message:"Project updated successfully",
                project
            });
    }catch(error){
        console.log(error);

        res.status(500).json({
            success:false,
            message:error.message
        });
    }
};


// Delete project

const deleteProject = async (req,res) =>{
    try{

        const {id} = req.params;

        const project = await Project.findOneAndDelete({
            _id:id,
            owner: req.userId,
        });

        if(!project){
            return res.status(404).json({
                success:false,
                message:"Project not found",
            });
        }

        res.json({
            success:true,
            message:"Project deleted successfully",
        });
    }catch(error){
        console.log(error)

        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};


// Update Project Status


const updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatus = [
            "Active",
            "Completed",
            "Archived",
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project status",
            });
        }

        const project = await Project.findOneAndUpdate(
            {
                _id: id,
                owner: req.userId,
            },
            {
                status,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project status updated successfully",
            project,
        });

    } catch (error) {
        console.error("Update project status error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update project status",
        });
    }
};



// Get Project Status

const getProjectsByStatus = async (req,res) =>{
    try {
        const {status} = req.params;

        const allowedStatus = [
            "Active",
            "Completed",
            "Archived",
        ];

        if(!allowedStatus.includes(status)){
            return res.json({
                success:false,
                message:"Invalid status",
            });
        }

        const projects  = await Project.find({
            owner: req.userId,
            status,
        }).sort({createdAt: -1});

        res.json({
            success: true,
            projects,
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
};

// IMPORTANT
export { createProject,getProjects,getSingleProject,updateProject,deleteProject,updateProjectStatus,getProjectsByStatus};