import express from "express";
import authMiddleware, { roleMiddleware } from "../middleware/auth.js";
import { registerRider, getRiderProfile, toggleAvailability, updateLocation, getAvailableJobs, acceptBatchJob } from "../controllers/riderController.js";

const riderRouter = express.Router();

riderRouter.post("/register", authMiddleware, roleMiddleware(['rider']), registerRider);
riderRouter.get("/me", authMiddleware, roleMiddleware(['rider']), getRiderProfile);
riderRouter.put("/me/availability", authMiddleware, roleMiddleware(['rider']), toggleAvailability);
riderRouter.put("/me/location", authMiddleware, roleMiddleware(['rider']), updateLocation);
riderRouter.get("/me/jobs", authMiddleware, roleMiddleware(['rider']), getAvailableJobs);
riderRouter.put("/jobs/batch/accept", authMiddleware, roleMiddleware(['rider']), acceptBatchJob);

export default riderRouter;
