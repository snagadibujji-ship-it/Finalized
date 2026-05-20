import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getProfile, updateProfile, getWallet, getMyOrders } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/me", authMiddleware, getProfile);
userRouter.put("/me", authMiddleware, updateProfile);
userRouter.get("/me/wallet", authMiddleware, getWallet);
userRouter.get("/me/orders", authMiddleware, getMyOrders);

export default userRouter;
