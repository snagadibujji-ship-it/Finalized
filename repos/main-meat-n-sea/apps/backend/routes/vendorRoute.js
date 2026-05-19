import express from "express";
import authMiddleware, { roleMiddleware } from "../middleware/auth.js";
import { registerVendor, getVendorProfile, updateVendorProfile, getNearbyVendors } from "../controllers/vendorController.js";

const vendorRouter = express.Router();

vendorRouter.post("/register", authMiddleware, roleMiddleware(['vendor']), registerVendor);
vendorRouter.get("/me", authMiddleware, roleMiddleware(['vendor']), getVendorProfile);
vendorRouter.put("/me", authMiddleware, roleMiddleware(['vendor']), updateVendorProfile);
vendorRouter.get("/nearby", getNearbyVendors);

export default vendorRouter;
