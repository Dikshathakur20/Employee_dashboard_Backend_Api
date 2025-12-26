import express from "express";
import getTodayWorkReport from "../controllers/EmployeeWorkReportController.js";

const router = express.Router();

// Route to get today's work report
router.get("/workreport", getTodayWorkReport);

export default router;
