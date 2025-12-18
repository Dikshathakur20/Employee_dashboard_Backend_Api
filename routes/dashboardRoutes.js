import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/dashboard-charts/attendance-summary", getDashboardSummary);

export default router;
