import express from "express";
import { loginUser, registerUser, getMe } from "../controllers/authController.js";
import authMiddleware from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.get("/me", authMiddleware, getMe);

export default authRouter;
