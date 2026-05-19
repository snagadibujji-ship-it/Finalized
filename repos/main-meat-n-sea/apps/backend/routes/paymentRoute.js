import express from "express";
import authMiddleware from "../middleware/auth.js";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-order", authMiddleware, createOrder);
paymentRouter.post("/verify", authMiddleware, verifyPayment);

export default paymentRouter;
