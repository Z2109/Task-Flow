import express from "express"
import {createProject, deleteProject, getProjects, getProjectsByStatus, getSingleProject, updateProject, updateProjectStatus} from "../controller/productController.js"
import authUser from "../middleware/auth.js";

const productRouter = express.Router();

productRouter.post('/create',authUser,createProject)
productRouter.get('/list',authUser,getProjects)
productRouter.get('/:id',authUser,getSingleProject)
productRouter.put('/:id',authUser,updateProject)
productRouter.delete('/:id',authUser,deleteProject)
productRouter.patch('/:id/status',authUser,updateProjectStatus)
productRouter.get('/status/:status', authUser, getProjectsByStatus);

export default productRouter;