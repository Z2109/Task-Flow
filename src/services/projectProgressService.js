import Project from "../models/projectModel.js";
import Task from "../models/taskModel.js";

/**
 * Synchronizes a project's status with its tasks.
 * Archived projects stay archived.
 * A project with at least one task and all tasks completed becomes Completed.
 * Otherwise (including zero tasks), the project becomes Active.
 */
const syncProjectStatus = async (projectId) => {
    const project = await Project.findById(projectId);

    if (!project || project.status === "Archived") {
        return project;
    }

    const totalTasks = await Task.countDocuments({ project: projectId });
    const completedTasks = await Task.countDocuments({
        project: projectId,
        status: "Completed",
    });

    const nextStatus =
        totalTasks > 0 && totalTasks === completedTasks
            ? "Completed"
            : "Active";

    if (project.status !== nextStatus) {
        project.status = nextStatus;
        await project.save();
    }

    return project;
};

export default syncProjectStatus;
