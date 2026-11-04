import express from "express";

import {
    loginUser,
    registerUser,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateProfile,
    changePassword,
    
} from "../controller/userController.js";

import authUser from "../middleware/auth.js";
import validateRequest from "../middleware/validateRequest.js";

import {
    loginValidator,
    signupValidator,
} from "../validators/authValidator.js";
import { registerInvitedUser } from "../controller/invitedRegistrationController.js";

const userRouter = express.Router();

// REGISTER
userRouter.post(
    "/register",
    validateRequest(signupValidator),
    registerUser
);

// LOGIN
userRouter.post(
    "/login",
    validateRequest(loginValidator),
    loginUser
);

// FORGOT PASSWORD
userRouter.post(
    "/forgot-password",
    forgotPassword
);

// RESET PASSWORD
userRouter.post(
    "/reset-password/:token",
    resetPassword
);

// SETTINGS ROUTES
userRouter.get("/me", authUser, getCurrentUser);

userRouter.put("/profile", authUser, updateProfile);

userRouter.patch("/change-password", authUser, changePassword);

// Register a new user through a valid invitation
userRouter.post(
    "/register-invited/:token",
    registerInvitedUser
);



export default userRouter;