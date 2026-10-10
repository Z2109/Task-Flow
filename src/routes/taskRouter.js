import express from "express"
import authUser from "../middleware/auth.js";
import { createTask ,getTasks ,getTaskbyId, updateTask, deleteTask, updateTaskStatus, getMyTasks, getProjectTasks, getTasksByStatus} from "../controller/taskController.js";


const taskRouter = express.Router();

taskRouter.post('/create',authUser,createTask)
taskRouter.get('/list',authUser,getTasks)
taskRouter.get('/:id',authUser,getTaskbyId)
taskRouter.put('/:id',authUser,updateTask)
taskRouter.delete('/:id',authUser,deleteTask)
taskRouter.patch('/status/:id',authUser,updateTaskStatus)
taskRouter.get('/my-tasks',authUser,getMyTasks)
taskRouter.get('/project/:projectId',authUser,getProjectTasks)
taskRouter.get('/status/:statu',authUser,getTasksByStatus)

export default taskRouter;