import express from "express";
import { getEmployeesMonthlySummary } from "../controllers/employeeDashboardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

// GET /api/dashboard-charts/employees-monthly-summary?year=2025
router.get("/employees-monthly-summary",authMiddleware, getEmployeesMonthlySummary);

export default router;
