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

export const getRecentTasks = async (req,res) =>{
    try {
        const tasks = await Task.find(
            getUserTaskFilter(req.userId)
        )

        .populate("project","name color")
        .populate("assignedTo","name email avatar")
        .populate("createdBy","name email avatar")
        .sort({ createdAt: -1})
        .limit(10)
        .lean();

        return res.status(200).json({
            success: true,
            count: true,
            data: tasks,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load recent tasks",
            error: error.message,
        });
    }
};

// get tasks assigned to the logged-in user

export const getMyDashboardTasks = async (req,res) => {
    try {
        const tasks = await Task.find({
            assignedTo: req.userId,
        })

        .populate("project","name color")
            .populate("createdBy","name email avatar")
            .sort({dueDate: 1, created: -1})
            .lean();

            return res.status(200).json({
                success: true,
                count: tasks.length,
                data: tasks,
            });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Failed to load your tasks",
            error: error.message,
        });
    }
};

// Get upcoming task deadlines(next 7 days)

export const getUpcomingDeadlines = async (req,res) =>{
    try {
        const now = new Date();
        const nextSevenDays = new Date();
        nextSevenDays.setDate(nextSevenDays.getDate() + 7);

        const tasks = await Task.find({
            ...getUserTaskFilter(req.userId),
            dueDate:{
                $gte: now,
                $lte: nextSevenDays,
            },
            status:{ $ne: "Completed"},
        })

        .populate("project","name color")
        .populate("assignedTo","name email")
        .sort({dueDate:1})
        .lean();

        // Include upcoming deadlinesfor project  owned by the user
        const project = await Project.find({
            owner: req.userId,
            dueDate:{
                $gte: now, //greater than and equal to 
                $lte: nextSevenDays, // less than and equal to
            },
            status:{$ne:"Completed"}
        })
        .sort({dueDate:1})
        .lean();

        return res.status(200).json({
            success:true,
            data:{
                tasks,
                projects,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load upcoming deadlines",
            error: error.message,
        });
    }
}

// get Overdue tasks
 export const getOverdueTasks = async (req,res) =>{
    try {
        const now = new Date();

        const tasks = await Task.find({
            ...getUserTaskFilter(req.userId),
            dueDate:{$lt: now},
            status:{$ne:"Completed"},
        })
        .populate("project","name color")
        .populate("assignedTo","name email")
        .sort({dueDate: 1})
        .lean();

        return res.status(200).json({
            success:true,
            count:tasks.length,
            data:tasks,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to load overdue tasks",
            error: error.message,
        });
    }
 }


//  get task statistics by status
export const getTaskStatistics = async (req,res) =>{
    try {
        const statistics = await Task.aggregate([
            {
                $match:{
                    $or:[
                        {createdby:req.userId},
                        {assignedto: req.userId},
                    ],
                },
            },
            {
                $group:{
                    _id: "$status",
                    count:{$sum: 1},
                },
            },
        ]);

        const result ={
            Todo:0,
            "In Progress":0,
            Review:0,
            Completed:0
        };

        statistics.forEach((item)=>{
            if(Object.prototype.hasOwnProperty.call(result,item._id)){
                result[item._id] = item.count;
            }
        });

        return res.status(200).json({
            success:true,
            data:result,
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Failed to load task statistics",
            error:error.message,
        });
    }
};

// project Progress

export const getProjectProgress = async (req,ress) =>{
    try {
        const projects = await Project.find({
            owner: req.userId
        });
        const progressData = [];

        for(let i = 0; i< projects.length; i++){
            const project = projects[i];

            const tasks = await Task.find({ project: project._id});

            let completedTasks = 0;

            for(let j = 0; j < tasks.length; j++){
                if(tasks[j].status === "Completed"){
                    completedTasks++;
                }
            }

            let progress = 0;

            if(tasks.length > 0){
                progress = Math.round((completedTasks / tasks.length) * 100);
            }

            progressData.push({
                project,
                totalTasks: tasks.length,
                completedTasks,
                progress
            });
        }

        res.status(200).json({
            success:true,
            count: progressData.length,
            data: progressData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Productivity Summary

export const getProductivitySummary = async (req,res) => {
    try {
        const createdTasks = await Task.find({ createdBy: req.userId});
        const assignedTasks = await Task.find({ assignedTo: req.userId});

        const allTasks = [...createdTasks];

        for(let i = 0; i < assignedTasks.length; i++){
            let found = false;

            for(let j = 0; j < allTasks.length; j++){
                if(assignedTasks[i]._id.toString() === allTasks[j]._id.toString()){
                    found = true;
                    break;
                }
            }

            if(!found) allTasks.push(assignedTasks[i]);
        }

        let completedTasks = 0;
        let overdueTasks = 0;

        for(let i = 0; i < allTasks.length; i++){
            if(allTasks[i].status === "Completed"){
                completedTasks++
            }else if(
                allTasks[i].dueDate &&
                new Date(allTasks[i].dueDate) < new Date()
            ){
                overdueTasks++;
            }
        }

        const totalTasks = allTasks.length;
        const pendingTasks = totalTasks - completedTasks;

        let completionRate = 0;

        if(totalTasks > 0){
            completionRate = Math.round((completedTasks / totalTasks) * 100)
        }

        re.status(200).json({
            success:true,
            data:{
                totalTasks,
                completedTasks,
                pendingTasks,
                overdueTasks,
                completionRate
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Project statistics

export const getProjectStatistics = async (req,res) =>{
    try {
        const active = await Project.countDocuments({
            owner:req.userId,
            status: "Active"
        });

        const archived = await Project.countDocuments({
            owner:req.userId,
            status: "archived"
        });

        const completed = await Project.countDocuments({
            owner:req.userId,
            status:"completed"
        });

        res.status(200).json({
            success:true,
            data:{
                Active : active,
                Completed : completed,
                Archived : archived,
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}





export default {getDashboardOverview,getRecentProjects,getRecentTasks,getMyDashboardTasks,getUpcomingDeadlines,getOverdueTasks,getTaskStatistics,getProjectProgress,getProductivitySummary,getProjectStatistics}