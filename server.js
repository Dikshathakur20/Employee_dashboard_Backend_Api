import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import dashboardRoutes from "./routes/dashboardRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";

dotenv.config();
const app = express();

app.use(cors()); 
app.use(express.json());

// Routes
app.use("/api", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
