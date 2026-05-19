import express from "express";
import authMiddleware, { roleMiddleware } from "../middleware/auth.js";
import {
  getDashboardStats, listAllVendors, approveVendor, rejectVendor,
  listAllRiders, listAllOrders, listAllUsers
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// Require admin role for all admin routes
adminRouter.use(authMiddleware, roleMiddleware(['admin']));

adminRouter.get("/dashboard", getDashboardStats);
adminRouter.get("/vendors", listAllVendors);
adminRouter.put("/vendors/:id/approve", approveVendor);
adminRouter.put("/vendors/:id/reject", rejectVendor);
adminRouter.get("/riders", listAllRiders);
adminRouter.get("/orders", listAllOrders);
adminRouter.get("/users", listAllUsers);
adminRouter.get("/payouts", (req, res) => res.json({ success: true, message: "List Payouts" }));

export default adminRouter;
