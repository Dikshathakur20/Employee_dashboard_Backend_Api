import express from "express";
import { getDesignationEmployeeTree } from "../controllers/employeeTreeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/dashboard-charts/employee-tree
router.get("/dashboard-charts/employee-tree",authMiddleware, getDesignationEmployeeTree);

export default router;
