
import express from "express";

import {
    loginUser,
    registerUser,
    forgotPassword,
    resetPassword,
} from "../controller/userController.js";

import validateRequest from "../middleware/validateRequest.js";

import {
    loginValidator,
    signupValidator,
} from "../validators/authValidator.js";

const userRouter = express.Router();

// Register user
userRouter.post(
    "/register",
    validateRequest(signupValidator),
    registerUser
);

// Login user
userRouter.post(
    "/login",
    validateRequest(loginValidator),
    loginUser
);

// Request a password reset email
userRouter.post(
    "/forgot-password",
    forgotPassword
);

// Reset password using the token from the email
userRouter.post(
    "/reset-password/:token",
    resetPassword
);

export default userRouter;
