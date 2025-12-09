import express from "express";
import { getGenderStats } from "../controllers/genderStatsController.js";

const router = express.Router();

router.get("/gender-stats", getGenderStats);

export default router;
