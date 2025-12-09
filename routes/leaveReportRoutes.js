import express from "express";
import { getYearlyLeaveReport } from "../controllers/leaveReportController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:year", authMiddleware,getYearlyLeaveReport);


export default router;
