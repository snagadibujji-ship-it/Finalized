import express from "express";

const adminRouter = express.Router();

// Placeholder routes for Phase 1 Setup
adminRouter.get("/dashboard", (req, res) => res.json({ success: true, message: "Admin Dashboard Stats" }));
adminRouter.get("/vendors", (req, res) => res.json({ success: true, message: "List All Vendors" }));
adminRouter.put("/vendors/:id/approve", (req, res) => res.json({ success: true, message: "Approve Vendor" }));
adminRouter.put("/vendors/:id/reject", (req, res) => res.json({ success: true, message: "Reject Vendor" }));
adminRouter.get("/riders", (req, res) => res.json({ success: true, message: "List All Riders" }));
adminRouter.get("/orders", (req, res) => res.json({ success: true, message: "List All Orders" }));
adminRouter.get("/users", (req, res) => res.json({ success: true, message: "List All Users/Customers" }));
adminRouter.get("/payouts", (req, res) => res.json({ success: true, message: "List Payouts" }));

export default adminRouter;
