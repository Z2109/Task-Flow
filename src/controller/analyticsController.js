
import Project from "../models/projectModel.js";
import Task from "../models/taskModel.js";

// Get Analytics Overview

const getAnalyticsOverview = async (req , res) =>{
    try {
        const projects = await Project.find({
            owner: req.userId,
        });

        const tasks = await Task.find({
            createdBy: req.userId,
        });

        const totalProjects = projects.length;

        const activeProjects = projects.filter(
            (project) => project.status === "Active"
        ).length;

        const completedProjects = projects.filter(
            (project) => project.status === "Completed"
        ).length;

        const archivedProjects = projects.filter(
            (project) => project.status === "Archived"
        ).length;

        const totalTasks = tasks.length;

        const completedTasks = tasks.filter(
            (task) => task.status === "Completed"
        ).length;
        
        const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

        return res.status(200).json({
            success:true,
            data: {
                totalProjects,
                activeProjects,
                completedProjects,
                archivedProjects,
                totalTasks,
                completedTasks,
                completionPercentage,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Get project-progress

const getProjectProgress = async (req, res) =>{
    try {
        const projects = await Project.find({
            owner: req.userId
        });

        const projectProgress = [];

        for(let i = 0 ; i < projects.length; i++){
            const project = projects[i];

            const tasks = await Task.find({
                project: project._id,
            });

            const totalTasks = tasks.length;

            let completedTasks = 0;

            for(let j = 0; j < tasks.length; j++){
                if(tasks[j].status === "Completed"){
                    completedTasks++;
                }
            }
            let progress = 0;

            if(totalTasks > 0){
                progress = Math.round(
                    (completedTasks / totalTasks) * 100
                );
            }

            projectProgress.push({
                projectId: project._id,
                projectName: project.name,
                totalTasks,
                completedTasks,
                progress,
            });
        }

        return res.status(200).json({
            success:true,
            count: projectProgress.length,
            data: projectProgress,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
};

// Get Task Status Analytics

const getTaskStatusAnalytics = async (req,res) =>{
    try {
        const tasks = await Task.find({
            createdBy: req.userId,
        });

        let todoTasks = 0;
        let inProgressTasks = 0;
        let reviewTasks = 0;
        let completedTasks = 0;

        for(let i = 0 ; i< tasks.length; i++){
            if(tasks[i].status === "Todo"){
                todoTasks++;
            }else if (tasks[i].status === "In Progress"){
                inProgressTasks++
            }else if (tasks[i].status === "Review"){
                reviewTasks++
            }else if (tasks[i].status === "Completed"){
                completedTasks++;
            }
        }

        return res.status(200).json({
            success:true,
            data:{
                totalTasks: tasks.length,
                todoTasks,
                inProgressTasks,
                reviewTasks,
                completedTasks,
            },
        });
    } catch (error) {
        console.lof(error)

        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
};

// Get Productivity Analytics

const getProductivityAnalytics = async (req,res) =>{
    try {
        const tasks = await Task.find({
            createdBy: req.userId,
        });

        const now = new Date();

        const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        const startOfNextMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            1
        );
            let completedThisMonth = 0;

            for(let i = 0; i < tasks.length ; i++){
                const task = tasks[i];

                if(
                    task.status === "Completed" &&
                    task.completedAt &&
                    new Date(task.completedAt) >= startOfMonth &&
                    new Date(task.completedAt) < startOfNextMonth
                ){
                    completedThisMonth++
                }
            }

            return res.status(200).json({
                success:true,
                month: now.toLocaleTimeString("en",{
                    month:"long",
                }),
                year: now.getFullYear(),
                completedTasks: completedThisMonth,
            });
    } catch (error) {
        console.lof(error)

        return res.status(500).json({
            success:false,
            message: error.message,
        });
    }
}


// Get Project-Specific Overview
const getProjectOverview = async (req, res) => {
    try {
        const projectId = req.projectId;

        // Get project details and team members
        const project = await Project.findById(projectId)
            .populate("owner", "name email avatar")
            .populate("members", "name email avatar")
            .lean();

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Get all tasks belonging to this project
        const tasks = await Task.find({
            project: projectId,
        })
            .populate("assignedTo", "name email avatar")
            .sort({ createdAt: -1 })
            .lean();

        // Task status counts
        const statistics = {
            totalTasks: tasks.length,
            todoTasks: 0,
            inProgressTasks: 0,
            reviewTasks: 0,
            completedTasks: 0,
            completionPercentage: 0,
        };

        // Priority counts
        const priority = {
            low: 0,
            medium: 0,
            high: 0,
        };

        tasks.forEach((task) => {
            switch (task.status) {
                case "Todo":
                    statistics.todoTasks++;
                    break;

                case "In Progress":
                    statistics.inProgressTasks++;
                    break;

                case "Review":
                    statistics.reviewTasks++;
                    break;

                case "Completed":
                    statistics.completedTasks++;
                    break;

                default:
                    break;
            }

            const taskPriority = task.priority?.toLowerCase();

            if (taskPriority && Object.hasOwn(priority, taskPriority)) {
                priority[taskPriority]++;
            }
        });

        // Calculate completion percentage
        statistics.completionPercentage =
            statistics.totalTasks === 0
                ? 0
                : Math.round(
                    (statistics.completedTasks / statistics.totalTasks) * 100
                );

        // Upcoming deadlines
        const now = new Date();

        const upcomingDeadlines = tasks
            .filter(
                (task) =>
                    task.dueDate &&
                    new Date(task.dueDate) >= now &&
                    task.status !== "Completed"
            )
            .sort(
                (a, b) =>
                    new Date(a.dueDate) - new Date(b.dueDate)
            )
            .slice(0, 5);

        // Overdue tasks
        const overdueTasks = tasks.filter(
            (task) =>
                task.dueDate &&
                new Date(task.dueDate) < now &&
                task.status !== "Completed"
        ).length;

        // Combine project owner and members without duplicates
        const teamMembers = [
            project.owner,
            ...(project.members || []),
        ].filter(
            (member, index, self) =>
                member &&
                self.findIndex(
                    (item) =>
                        item._id.toString() === member._id.toString()
                ) === index
        );

        return res.status(200).json({
            success: true,
            data: {
                project,
                statistics,
                priority,
                teamMembers,
                upcomingDeadlines,
                overdueTasks,
                recentTasks: tasks.slice(0, 5),
            },
        });

    } catch (error) {
        console.error("Project overview error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load project overview",
            error: error.message,
        });
    }
};



export { getAnalyticsOverview ,getProjectProgress ,getTaskStatusAnalytics ,getProductivityAnalytics ,getProjectOverview};