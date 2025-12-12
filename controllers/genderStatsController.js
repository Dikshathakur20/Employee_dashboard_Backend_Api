import sql from "mssql";
import { poolPromise } from "../config/db.js";

export async function getGenderStats(req, res) {
  try {
    const selectedYear = parseInt(req.query.year, 10);
    const selectedMonth = req.query.month ? parseInt(req.query.month, 10) : null;

    // ✅ Validations
    if (!selectedYear) {
      return res.status(400).json({
        status: false,
        message: "Year is required (e.g., ?year=2025)"
      });
    }
    if (selectedMonth && (selectedMonth < 1 || selectedMonth > 12)) {
      return res.status(400).json({
        status: false,
        message: "Month must be between 1 and 12"
      });
    }

    const pool = await poolPromise;
    if (!pool) {
      return res.status(500).json({
        status: false,
        message: "Database connection failed"
      });
    }

    // ✅ Start and End of month/year
    let startDate, endDate;
    if (selectedMonth) {
      startDate = new Date(selectedYear, selectedMonth - 1, 1);
      endDate = new Date(selectedYear, selectedMonth, 0);
    } else {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // ✅ Gender Count Query
    const genderQuery = `
      SELECT 
        Gender,
        COUNT(*) AS Count
      FROM tbl_Employees
      WHERE 
        IsDeleted = 0
        AND (
          ActiveId = 1
          OR (ActiveId = 2 AND ReleaseDate IS NOT NULL)
        )
        AND TRY_CONVERT(date, JoiningDate, 103) <= @EndDate
        AND (ReleaseDate IS NULL OR TRY_CONVERT(date, ReleaseDate, 105) >= @StartDate)
        AND Gender IN ('Male', 'Female')
      GROUP BY Gender
    `;

    const genderResult = await pool.request()
      .input("StartDate", sql.Date, startDateStr)
      .input("EndDate", sql.Date, endDateStr)
      .query(genderQuery);

    // ✅ Total Employees Query
    const totalQuery = `
      SELECT COUNT(*) AS TotalEmployees
      FROM tbl_Employees
      WHERE
        IsDeleted = 0
        AND (
          ActiveId = 1
          OR (ActiveId = 2 AND ReleaseDate IS NOT NULL)
        )
        AND TRY_CONVERT(date, JoiningDate, 103) <= @EndDate
        AND (ReleaseDate IS NULL OR TRY_CONVERT(date, ReleaseDate, 105) >= @StartDate)
    `;

    const totalResult = await pool.request()
      .input("StartDate", sql.Date, startDateStr)
      .input("EndDate", sql.Date, endDateStr)
      .query(totalQuery);

    return res.status(200).json({
      status: true,
      message: `Gender statistics for ${selectedMonth || "year"}-${selectedYear} fetched successfully`,
      data: genderResult.recordset,
      totalEmployees: totalResult.recordset[0].TotalEmployees
    });

  } catch (error) {
    console.error("Error fetching gender stats:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message
    });
  }
}
