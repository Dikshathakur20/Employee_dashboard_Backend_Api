import { poolPromise } from "../config/db.js";
import jwt from "jsonwebtoken";

const getEmployeeLeavesSummary = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.employeeId;

    const pool = await poolPromise;

    const result = await pool.request()
  .input("EmpId", employeeId)
  .query(`
    DECLARE @CurrentYear INT = YEAR(GETDATE());
    DECLARE @TotalLeaves INT = 0;
    DECLARE @LeavesTaken FLOAT = 0;
    DECLARE @PendingRequests INT = 0;

    -- TOTAL LEAVES (SAFE DATE HANDLING)
    SELECT 
      @TotalLeaves =
      CASE
        WHEN YEAR(TRY_CONVERT(DATE, JoiningDate, 103)) < @CurrentYear THEN 12
        WHEN YEAR(TRY_CONVERT(DATE, JoiningDate, 103)) = @CurrentYear
             AND TRY_CONVERT(DATE, JoiningDate, 103) < DATEFROMPARTS(@CurrentYear, 6, 1)
        THEN 12
        ELSE 6
      END
    FROM tbl_Employees
    WHERE EmployeeId = @EmpId
      AND ActiveId = 1
      AND IsDeleted = 0;

    -- LEAVES TAKEN (SAFE DATE HANDLING)
    SELECT 
      @LeavesTaken = ISNULL(SUM(CAST(NoOfDays AS FLOAT)), 0)
    FROM tbl_LeaveDetails
    WHERE EmployeeId = @EmpId
      AND ApprovalStatus = 1
      AND NoOfDays NOT IN ('0.1','0.2')
      AND YEAR(TRY_CONVERT(DATE, StartDate, 103)) = @CurrentYear;

    -- PENDING REQUESTS
    SELECT 
      @PendingRequests = COUNT(*)
    FROM tbl_LeaveDetails
    WHERE EmployeeId = @EmpId
      AND ApprovalStatus = 0;

    SELECT 
      @TotalLeaves AS TotalLeaves,
      @LeavesTaken AS LeavesTaken,
      @PendingRequests AS PendingRequests;
  `);


    res.status(200).json({
      message: "Leave summary fetched successfully",
      data: result.recordset[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default getEmployeeLeavesSummary;
