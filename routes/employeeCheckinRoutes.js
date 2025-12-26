import express from "express";
import employeeCheckIn from "../controllers/EmployeeCheckinController.js";

const router = express.Router();

router.post("/check-in", employeeCheckIn);

export default router;
