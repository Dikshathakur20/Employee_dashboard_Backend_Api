import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import dashboardRoutes from "./routes/dashboardRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import leaveReportRoutes from "./routes/leaveReportRoutes.js";
import employeeStatsRoutes from "./routes/employeeStatsRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import genderStatsRoutes from "./routes/genderStatsRoutes.js";
import attendanceHeatmapRoutes from "./routes/attendanceHeatmapRoutes.js";
import employeeSalaryRoutes from "./routes/employeeSalaryRoutes.js";


dotenv.config();
const app = express();

app.use(cors()); 
app.use(express.json());

// Routes
app.use("/api", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave-report", leaveRoutes);
app.use("/api/dashboard-charts/leaves-report", leaveReportRoutes);
app.use("/api", employeeStatsRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/dashboard-charts", genderStatsRoutes);
app.use("/api/dashboard-charts", attendanceHeatmapRoutes);
app.use("/api", employeeSalaryRoutes);


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
