// routes/projectChartRoutes.js
import express from "express";
import {
  getProjectChartData,
  getProjectImage
} from "../controllers/projectChartController.js";

const router = express.Router();

router.get("/chart", getProjectChartData);
router.get("/image/:id", getProjectImage);

export default router;
