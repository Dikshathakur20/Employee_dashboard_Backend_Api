// routes/employeeSalaryRoutes.js

import express from "express";
import { getEmployeeSalaries } from "../controllers/employeeSalaryController.js";

const router = express.Router();

// GET: /api/employees-dashboard-charts/salaries
router.get("/employees-dashboard-charts/salaries", getEmployeeSalaries);

export default router;
