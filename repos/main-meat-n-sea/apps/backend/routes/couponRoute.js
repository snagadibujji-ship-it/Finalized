import express from "express";
import authMiddleware from "../middleware/auth.js";
import { validateCoupon } from "../controllers/couponController.js";

const couponRouter = express.Router();

couponRouter.post("/validate", authMiddleware, validateCoupon);

export default couponRouter;
