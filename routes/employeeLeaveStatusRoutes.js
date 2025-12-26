import express from "express";
import getTodayLeaveStatus from "../controllers/employeeLeaveStatusController.js";

const router = express.Router();

// Route to get today's leave status
router.get("/leavestatus", getTodayLeaveStatus);

export default router;
