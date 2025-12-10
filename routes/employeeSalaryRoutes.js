import express from "express";
import { getEmployeeSalaries } from "../controllers/employeeSalaryController.js";
import { getEmployeeImage } from "../controllers/employeeImageController.js";

const router = express.Router();

router.get("/employees-dashboard-charts/salaries", getEmployeeSalaries);
router.get("/employee/image/:id", getEmployeeImage);

export default router;
