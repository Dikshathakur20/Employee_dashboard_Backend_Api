import express from "express";
import getEmployeeLeavesSummary from "../controllers/EmployeeLeaveController.js";

const router = express.Router();

// 🔐 Employee Leave Summary (JWT Protected)
router.get("/leave-summary", getEmployeeLeavesSummary);

export default router;
