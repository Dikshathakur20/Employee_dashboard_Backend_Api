import express from "express";
import { getAttendanceHeatmap } from "../controllers/attendanceHeatmapController.js";

const router = express.Router();

// Example: /api/dashboard-charts/attendance-heatmap?year=2025&month=12
router.get("/attendance-heatmap", getAttendanceHeatmap);

export default router;
