import express from "express";
import checkoutEmployee from "../controllers/EmployeeCheckoutController.js";

const router = express.Router();

// Employee Checkout Route
router.post("/checkout", checkoutEmployee);

export default router;
