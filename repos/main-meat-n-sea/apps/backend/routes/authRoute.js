import express from "express";

const authRouter = express.Router();

// Placeholder routes for Phase 1 Setup
authRouter.post("/register", (req, res) => res.json({ success: true, message: "Register" }));
authRouter.post("/login", (req, res) => res.json({ success: true, message: "Login" }));
authRouter.post("/refresh", (req, res) => res.json({ success: true, message: "Refresh token" }));
authRouter.post("/logout", (req, res) => res.json({ success: true, message: "Logout" }));

export default authRouter;
