
import express from "express";

import {
    createTask,
    getTasks,
    getSingleTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getMyTasks,
    getProjectTasks,
    getTasksByStatus,
    assignTask,
    unassignTask,
} from "../controller/taskController.js";

import authUser from "../middleware/auth.js";
import organizationContext from "../middleware/organizationContext.js";
import authorizePermission from "../middleware/authorizePermission.js";
import authorizedTask from "../middleware/authorizedTask.js";

const taskRouter = express.Router();


// Create Task

taskRouter.post(
    "/create",
    authUser,
    organizationContext,
    authorizePermission("task:create"),
    createTask
);


// Get My Tasks

taskRouter.get(
    "/my-tasks",
    authUser,
    organizationContext,
    authorizePermission("task:read"),
    getMyTasks
);


// Get Tasks By Status

taskRouter.get(
    "/status/:status",
    authUser,
    organizationContext,
    authorizePermission("task:read"),
    getTasksByStatus
);


// Get Tasks For A Project

taskRouter.get(
    "/project/:projectId",
    authUser,
    organizationContext,
    authorizePermission("task:read"),
    getProjectTasks
);


// Get All Tasks

taskRouter.get(
    "/list",
    authUser,
    organizationContext,
    authorizePermission("task:read"),
    getTasks
);


// Update Task Status

taskRouter.patch(
    "/:id/status",
    authUser,
    organizationContext,
    authorizedTask,
    authorizePermission("task:update"),
    updateTaskStatus
);


// Get Single Task

taskRouter.get(
    "/:id",
    authUser,
    organizationContext,
    authorizedTask,
    authorizePermission("task:read"),
    getSingleTask
);


// Update Task

taskRouter.put(
    "/:id",
    authUser,
    organizationContext,
    authorizedTask,
    authorizePermission("task:update"),
    updateTask
);


// Delete Task

taskRouter.delete(
    "/:id",
    authUser,
    organizationContext,
    authorizedTask,
    authorizePermission("task:delete"),
    deleteTask
);

taskRouter.patch(
    "/:id/assign",
    authUser,
    organizationContext,
    authorizedTask,
    authorizePermission("task:assign"),
    assignTask
);


taskRouter.patch(
    "/:id/unassign",
    authUser,
    organizationContext,
    authorizedTask,
    authorizePermission("task:assign"),
    unassignTask
);


export default taskRouter;
