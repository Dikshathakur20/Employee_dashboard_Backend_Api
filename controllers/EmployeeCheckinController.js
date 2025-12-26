import { poolPromise } from "../config/db.js";
import jwt from "jsonwebtoken";

const employeeCheckIn = async (req, res) => {
  try {
    // 🔐 GET TOKEN
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // 🔓 VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.employeeId;

    const pool = await poolPromise;

    // 🕒 CURRENT DATE (ONLY DATE PART)
    const checkQuery = `
      SELECT CheckId
      FROM tbl_EmployeeCheck
      WHERE EmployeeId = @EmployeeId
        AND CAST(CheckInTime AS DATE) = CAST(GETDATE() AS DATE)
        AND IsDeleted = 0
    `;

    const checkResult = await pool.request()
      .input("EmployeeId", employeeId)
      .query(checkQuery);

    // ❌ ALREADY CHECKED IN
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        message: "Check-in already recorded for today"
      });
    }

    // ✅ INSERT CHECK-IN
    const insertQuery = `
      INSERT INTO tbl_EmployeeCheck
      (
        CheckInTime,
        EmployeeId,
        IsDeleted,
        CreatedOn,
        Dated,
        IsLeave
      )
      VALUES
      (
        GETDATE(),
        @EmployeeId,
        0,
        GETDATE(),
        CAST(GETDATE() AS DATE),
        0
      )
    `;

    await pool.request()
      .input("EmployeeId", employeeId)
      .query(insertQuery);

    return res.status(200).json({
      message: "Check-in successful",
      checkInTime: new Date()
    });

  } catch (error) {
    console.error("Check-in Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

export default employeeCheckIn;
