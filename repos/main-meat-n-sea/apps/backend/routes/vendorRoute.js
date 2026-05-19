import express from "express";

const vendorRouter = express.Router();

// Placeholder routes for Phase 1 Setup
vendorRouter.post("/register", (req, res) => res.json({ success: true, message: "Register Vendor" }));
vendorRouter.get("/me", (req, res) => res.json({ success: true, message: "Get Vendor Profile" }));
vendorRouter.put("/me", (req, res) => res.json({ success: true, message: "Update Vendor Profile" }));
vendorRouter.get("/nearby", (req, res) => res.json({ success: true, message: "List Nearby Vendors" }));

export default vendorRouter;
