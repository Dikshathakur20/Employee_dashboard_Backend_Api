import express from "express";
import { getAvailableYears } from "../controllers/employeeController.js";

const router = express.Router();

// Route to get available years
router.get("/available-years", getAvailableYears);

export default router;
