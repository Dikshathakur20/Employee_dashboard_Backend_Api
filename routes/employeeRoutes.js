import express from "express";
import { getAvailableYears } from "../controllers/employeeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

// Route to get available years
router.get("/available-years",authMiddleware,getAvailableYears);

export default router;
