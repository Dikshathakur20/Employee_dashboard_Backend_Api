import sql from "mssql";
import { poolPromise } from "../config/db.js";

export async function getGenderStats(req, res) {
  try {
    const selectedYear = parseInt(req.query.year, 10);

    if (!selectedYear) {
      return res.status(400).json({
        status: false,
        message: "Year is required (e.g., ?year=2025)"
      });
    }

    const pool = await poolPromise;

    if (!pool) {
      return res.status(500).json({
        status: false,
        message: "Database connection failed"
      });
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
        AND YEAR(TRY_CONVERT(date, JoiningDate, 103)) <= @SelectedYear
        AND Gender IN ('Male', 'Female')
      GROUP BY Gender
    `;

    const genderResult = await pool.request()
      .input("SelectedYear", sql.Int, selectedYear)
      .query(genderQuery);

    // 2️⃣ Total Employees Query
    const totalQuery = `
      SELECT COUNT(*) AS TotalEmployees
      FROM tbl_Employees
      WHERE
        ActiveId = 1
        AND IsDeleted = 0
        AND YEAR(TRY_CONVERT(date, JoiningDate, 103)) <= @SelectedYear
    `;

    const totalResult = await pool.request()
      .input("SelectedYear", sql.Int, selectedYear)
      .query(totalQuery);

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
