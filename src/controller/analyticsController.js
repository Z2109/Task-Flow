
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

export { getAnalyticsOverview ,getProjectProgress ,getTaskStatusAnalytics ,getProductivityAnalytics};