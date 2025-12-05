import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getLeaveSummary } from "../controllers/leaveController.js";

const router = express.Router();

// GET leave summary for a year

router.get("/dashboard-charts/leaves-summary/:year",authMiddleware, getLeaveSummary);

export default router;
