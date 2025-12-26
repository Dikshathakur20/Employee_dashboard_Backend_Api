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
import employeeTreeRoutes from "./routes/employeeTreeRoutes.js";
import employeedashboardRoutes from "./routes/employeeDashboardRoutes.js";
import eventsCalendarRoutes from "./routes/eventsCalendarRoutes.js";
import projectChartRoutes from "./routes/projectChartRoutes.js";
import authRoutes from './routes/authRoutes.js';
import employeeLeaveRoutes from "./routes/employeeLeaveRoutes.js";
import employeeCheckinRoutes from "./routes/employeeCheckinRoutes.js";
import employeeCheckoutRoutes from "./routes/employeeCheckoutRoutes.js";
import employeeWorkReportRoutes from "./routes/employeeWorkReportRoutes.js"
import employeeLeaveStatusRoutes from "./routes/employeeLeaveStatusRoutes.js"; // correct path


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
app.use("/api", employeeTreeRoutes);
app.use("/api/dashboard-charts", employeedashboardRoutes);
app.use("/api/dashboard-charts", eventsCalendarRoutes);
app.use("/api/projects", projectChartRoutes);
app.use('/api/auth', authRoutes);

app.use("/api/employee-leaves", employeeLeaveRoutes);
app.use("/api/employee", employeeCheckinRoutes);
app.use("/api/employee", employeeCheckoutRoutes);
app.use("/api/employee", employeeWorkReportRoutes);
app.use("/api/employee", employeeLeaveStatusRoutes);
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
