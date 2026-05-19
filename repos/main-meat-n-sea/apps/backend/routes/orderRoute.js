import express from "express";
import authMiddleware, { roleMiddleware } from "../middleware/auth.js";
import { placeOrder, getOrderDetails, cancelOrder, trackOrder } from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/", authMiddleware, roleMiddleware(['customer']), placeOrder);
orderRouter.get("/:id", authMiddleware, getOrderDetails);
orderRouter.put("/:id/cancel", authMiddleware, roleMiddleware(['customer']), cancelOrder);
orderRouter.get("/:id/track", authMiddleware, trackOrder);

export default orderRouter;