import express from "express";
import { getGenderStats } from "../controllers/genderStatsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/gender-stats", getGenderStats);

export default router;
