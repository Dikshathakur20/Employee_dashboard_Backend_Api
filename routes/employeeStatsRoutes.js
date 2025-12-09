import express from "express";
import { getEmployeeStats } from "../controllers/employeeStatsController.js";

const router = express.Router();

router.get("/employee-stats", getEmployeeStats);

export default router;
