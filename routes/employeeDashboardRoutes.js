import express from "express";
import { getEmployeesMonthlySummary } from "../controllers/employeeDashboardController.js";

const router = express.Router();

// GET /api/dashboard-charts/employees-monthly-summary?year=2025
router.get("/employees-monthly-summary", getEmployeesMonthlySummary);

export default router;
