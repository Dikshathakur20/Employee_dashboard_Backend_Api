import express from "express";
import { getEmployeeStats } from "../controllers/employeeStatsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/employee-stats",authMiddleware , getEmployeeStats);

export default router;
