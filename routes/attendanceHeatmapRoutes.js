import express from "express";
import { getAttendanceHeatmap } from "../controllers/attendanceHeatmapController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

// Example: /api/dashboard-charts/attendance-heatmap?year=2025&month=12
router.get("/attendance-heatmap",authMiddleware, getAttendanceHeatmap);

export default router;
