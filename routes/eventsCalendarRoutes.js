import express from "express";
import { getEventsCalendar } from "../controllers/eventsCalendarController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

// FIXED: remove the duplicate /dashboard-charts
router.get("/events-calendar",authMiddleware, getEventsCalendar);

export default router;
