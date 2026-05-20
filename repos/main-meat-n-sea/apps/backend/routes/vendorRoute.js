import express from "express";
import authMiddleware, { roleMiddleware } from "../middleware/auth.js";
import { registerVendor, getVendorProfile, updateVendorProfile, getNearbyVendors } from "../controllers/vendorController.js";
import { getVendorOrders, updateOrderStatus } from "../controllers/orderController.js";

const vendorRouter = express.Router();

vendorRouter.post("/register", authMiddleware, roleMiddleware(['vendor']), registerVendor);
vendorRouter.get("/me", authMiddleware, roleMiddleware(['vendor']), getVendorProfile);
vendorRouter.put("/me", authMiddleware, roleMiddleware(['vendor']), updateVendorProfile);
vendorRouter.get("/nearby", getNearbyVendors);

// Vendor Order Management Routes
vendorRouter.get("/me/orders", authMiddleware, roleMiddleware(['vendor']), getVendorOrders);
vendorRouter.put("/me/orders/:id/status", authMiddleware, roleMiddleware(['vendor']), updateOrderStatus);

export default vendorRouter;
