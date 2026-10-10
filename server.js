import "dotenv/config";
import express from "express";
import cors from "cors";

import connectToDb from "./src/config/db.js";

import userRouter from "./src/routes/userRouter.js";
import productRouter from "./src/routes/productRouter.js";
import taskRouter from "./src/routes/taskRouter.js";
import dashboardRouter from "./src/routes/dashboardRouter.js";


const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Check environment variable
console.log("MongoDB URL loaded:", !!process.env.MONGODB_URL);

// Connect MongoDB
connectToDb();





// Api end points
app.use('/api/user',userRouter)
app.use('/api/project',productRouter)
app.use('/api/task',taskRouter)
app.use('/api/dashboard',dashboardRouter)





// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});