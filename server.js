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

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
