import express from "express";
import { getYearlyLeaveReport } from "../controllers/leaveReportController.js";


const router = express.Router();

router.get("/:year", getYearlyLeaveReport);


export default router;
