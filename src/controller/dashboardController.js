import Project from "../models/projectModel.js"
import Task from "../models/taskModel.js"

// Helper: tasks created by or assigned to the logged-in user

const getUserTaskFilter = (userId) => ({
    $or:[
        {createdby:userId},
        {assignedTo:userId},
    ],
});
// 
// 1 Dashboard overview statistics

export const getDashboardOverview = async (req,res) =>{
    try {
        const userId = req.userId;
        const taskFilter = getUserTaskFilter(userId);

        const[
            totalProjects,
            activeProjects,
            completedProjects,
            archivedProjects,
            totalTasks,
            todoTasks,
            inProgressTasks,
            reviewTasks,
            completedTasks,
        ] = await Promise.all([
            Project.countDocuments({owner: userId}),
            Project.countDocuments({owner: userId, status: "Active"}),
            Project.countDocuments({owner: userId, status: "Completed"}),
            Project.countDocuments({owner: userId, status: "Archived"}),

            Task.countDocuments(taskFilter),
            Task.countDocuments({...taskFilter, status: "Todo"}),
            Task.countDocuments({...taskFilter, status: "In Progress"}),
            Task.countDocuments({...taskFilter, status: "Review"}),
            Task.countDocuments({...taskFilter, status: "Completed"}),
        ]);

        const pendingTasks = totalTasks - completedTasks;

        const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        return res.status(200).json({
            success:true,
            data:{
                projects:{
                    total: totalProjects,
                    active: activeProjects,
                    completed: completedProjects,
                    archived: archivedProjects,
                },
                tasks:{
                    total: totalTasks,
                    todo : todoTasks,
                    inProgress: inProgressTasks,
                    inReview: reviewTasks,
                    completed: completedTasks,
                    pending: pendingTasks,
                },
                productivity:{
                    completionRate,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Failed to load dashboard overview",
            error:error.message,
        });
    }
};


// Get recent projects

export const getRecentProjects = async (req,res) =>{
    try {
        const projects = await Project.find({
            owner: req.userId,
        })
        .sort({ createdAt: -1})
        .limit(5)
        .lean();

        return res.status(200).json({
            success:true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Failed to load recent projects",
            error: error.message,
        });
    }
};

// Get recent tasks created by or assigned to the user





export default {getDashboardOverview,getRecentProjects}