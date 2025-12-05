import express from "express";
import { getAttendanceLateComing } from "../controllers/attendanceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

// Route for getting late attendance
// Example: GET /api/attendance/late?year=2025&month=12
router.get("/late",authMiddleware,getAttendanceLateComing);

export default router;
