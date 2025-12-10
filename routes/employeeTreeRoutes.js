import express from "express";
import { getDesignationEmployeeTree } from "../controllers/employeeTreeController.js";

const router = express.Router();

// GET /api/dashboard-charts/employee-tree
router.get("/dashboard-charts/employee-tree", getDesignationEmployeeTree);

export default router;
