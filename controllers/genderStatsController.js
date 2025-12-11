import sql from "mssql";
import { poolPromise } from "../config/db.js";

export async function getGenderStats(req, res) {
  try {
    const selectedYear = parseInt(req.query.year, 10);
    const selectedMonth = req.query.month ? parseInt(req.query.month, 10) : null;

    // Validation
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

    // Create dynamic date filter
    let dateFilter = `
      YEAR(TRY_CONVERT(date, JoiningDate, 103)) <= @SelectedYear
    `;

    if (selectedMonth) {
      dateFilter += ` AND MONTH(TRY_CONVERT(date, JoiningDate, 103)) <= @SelectedMonth`;
    }

    // 1️⃣ Gender Count Query
    const genderQuery = `
      SELECT 
        Gender,
        COUNT(*) AS Count
      FROM tbl_Employees
      WHERE 
        ActiveId = 1
        AND IsDeleted = 0
        AND ${dateFilter}
        AND Gender IN ('Male', 'Female')
      GROUP BY Gender
    `;

    const genderRequest = pool.request()
      .input("SelectedYear", sql.Int, selectedYear);

    if (selectedMonth) {
      genderRequest.input("SelectedMonth", sql.Int, selectedMonth);
    }

    const genderResult = await genderRequest.query(genderQuery);

    // 2️⃣ Total Employees Query
    const totalQuery = `
      SELECT COUNT(*) AS TotalEmployees
      FROM tbl_Employees
      WHERE
        ActiveId = 1
        AND IsDeleted = 0
        AND ${dateFilter}
    `;

    const totalRequest = pool.request()
      .input("SelectedYear", sql.Int, selectedYear);

    if (selectedMonth) {
      totalRequest.input("SelectedMonth", sql.Int, selectedMonth);
    }

    const totalResult = await totalRequest.query(totalQuery);

    return res.status(200).json({
      status: true,
      message: "Gender statistics fetched successfully",
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
