import express from "express";
// import { loginUser,registerUser } from "../controllers/userController.js";

const userRouter = express.Router();

// Placeholders replacing direct auth routes
userRouter.get("/me", (req, res) => res.json({ success: true, message: "Get My Profile" }));
userRouter.put("/me", (req, res) => res.json({ success: true, message: "Update Profile" }));
userRouter.get("/me/wallet", (req, res) => res.json({ success: true, message: "Get Wallet Balance" }));
userRouter.get("/me/orders", (req, res) => res.json({ success: true, message: "Get My Orders" }));

export default userRouter;
