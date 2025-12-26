import { poolPromise } from "../config/db.js";
import jwt from "jsonwebtoken";

// Get Today's Work Report for Logged-in Employee
const getTodayWorkReport = async (req, res) => {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const employeeId = decoded.employeeId;

    const pool = await poolPromise;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // start of tomorrow

    const query = `
      SELECT TOP 1 *
      FROM tbl_EmployeeCheck
      WHERE EmployeeId = @EmployeeId
        AND IsDeleted = 0
        AND Dated >= @Today
        AND Dated < @Tomorrow
      ORDER BY CheckInTime DESC
    `;

    const result = await pool
      .request()
      .input("EmployeeId", employeeId)
      .input("Today", today)
      .input("Tomorrow", tomorrow)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "No work report found for today" });
    }

    const record = result.recordset[0];

    return res.status(200).json({
      message: "Today's work report fetched successfully",
      data: {
        checkId: record.CheckId,
        checkInTime: record.CheckInTime,
        checkOutTime: record.CheckOutTime,
        workReport: record.WorkReport,
      },
    });

  } catch (err) {
    console.error("Work Report Error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export default getTodayWorkReport;
