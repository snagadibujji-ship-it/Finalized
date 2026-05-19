import express from "express";

const riderRouter = express.Router();

// Placeholder routes for Phase 1 Setup
riderRouter.post("/register", (req, res) => res.json({ success: true, message: "Register Rider" }));
riderRouter.get("/me", (req, res) => res.json({ success: true, message: "My Rider Profile" }));
riderRouter.put("/me/availability", (req, res) => res.json({ success: true, message: "Toggle Availability" }));
riderRouter.put("/me/location", (req, res) => res.json({ success: true, message: "Update Location" }));
riderRouter.get("/me/jobs", (req, res) => res.json({ success: true, message: "Get Nearby Jobs" }));

export default riderRouter;
