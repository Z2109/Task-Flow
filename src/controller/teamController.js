import Project from "../models/projectModel.js";
import User from "../models/userModel.js";

// Add team member to project

const addTeamMember = async (req, res) => {
    try {
        const { userId } = req.body;

        // Check whether userId is provided

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        // Find project

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Check project ownership

        const projectOwnerId = String(project.owner);
        const loggedInUserId = String(req.userId);

        if (projectOwnerId !== loggedInUserId) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to manage this project",
            });
        }

        // Check whether the user exists

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Prevent adding the project owner as a member

        if (projectOwnerId === String(userId)) {
            return res.status(400).json({
                success: false,
                message: "Project owner is already part of the project",
            });
        }

        // Check whether the user is already a member

        const alreadyMember = project.members.some(
            (member) => String(member) === String(userId)
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: "User is already a project member",
            });
        }

        // Add member

        project.members.push(user._id);

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Team member added successfully",
            project,
        });

    } catch (error) {
        console.error("Add Team Member Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get Project Members

const getProjectMembers = async (req,res) =>{
    try {
        const project = await Project.findById(req.params.id)
        .populate("owner", "name email")
        .populate("members", "name email");

        if(!project){
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Check whether the logged-in user is the owner

        const isOwner = project.owner._id.toString() === String(req.userId);

        // Check whether the logged-in user is a member

        const isMember = project.members.some(
            (member) => member._id.toString() === String(req.userId)
        );

        if(!isOwner && !isMember){
            return res.status(403).json({
                success: false,
                message: "You are not allowed to view this project",
            });
        }

        return res.status(200).json({
            success: true,
            owner: project.owner,
            totalMembers: project.members.length,
            members: project.members,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Get My Projects

const getMyProjects = async (req, res) => {
    try {
        const userId = req.userId;

        // Find projects owned by the logged-in user
        const ownedProjects = await Project.find({
            owner: userId,
        }).populate("owner", "name email");

        // Find projects where the user is a member
        const memberProjects = await Project.find({
            members: userId,
        }).populate("owner", "name email");

        // Combine both lists
        const projects = [...ownedProjects];

        memberProjects.forEach((project) => {
            const alreadyExists = projects.some(
                (item) => String(item._id) === String(project._id)
            );

            if (!alreadyExists) {
                projects.push(project);
            }
        });

        return res.status(200).json({
            success: true,
            totalProjects: projects.length,
            projects,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Remove team member

const removeTeamMember = async (req,res) =>{
    try {
        const project = await Project.findById(req.params.id);

        if(!project){
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Only the project owner can remove members

        if(String(project.owner) !== String(req.userId)){
            return res.status(403).json({
                success: false,
                message: "Only the project owner can remove members",
            });
        }

        const userId = req.params.userId;

        // Check whether the user is a member

        const memberExists = project.members.some(
            (member) => String(member) === String(userId)
        );

        if(!memberExists){
            return res.status(404).json({
                success: false,
                message: "Team member not found in this project",
            });
        }

        // Remove the member

        project.members = project.members.filter(
            (member) => String(member) !== String(userId)
        );

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Team member removed successfully",
            members: project.members,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


export { addTeamMember,getProjectMembers,getMyProjects,removeTeamMember};