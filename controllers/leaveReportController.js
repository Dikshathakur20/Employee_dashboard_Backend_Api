import { poolPromise } from "../config/db.js";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const getYearlyLeaveReport = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    if (!year) return res.status(400).json({ message: "Year is required" });

    const pool = await poolPromise;

    // Helper: empty month object
    const emptyMonths = () => MONTHS.reduce((acc, m) => ({ ...acc, [m]: 0 }), {});

    const finalEmployees = {};

    // 1️⃣ Get full leaves per month
    const fullLeaveResult = await pool.request()
      .execute("Sp_GetLeavesCountByMONTH"); // Stored procedure

    const fullLeaveRows = fullLeaveResult.recordset;

    for (const row of fullLeaveRows) {
      if (!finalEmployees[row.EmployeeId]) {
        finalEmployees[row.EmployeeId] = {
          id: row.EmployeeId,
          name: row.Name,
          leaves: emptyMonths(),
          shortLeaves: emptyMonths(),
          totalLeaves: 0,
          totalShortLeaves: 0
        };
      }

      MONTHS.forEach((m, i) => {
        const monthValue = row[m] || 0;
        finalEmployees[row.EmployeeId].leaves[m] = monthValue;
        finalEmployees[row.EmployeeId].totalLeaves += monthValue;
      });
    }

    // 2️⃣ Get short leaves per month
    const shortLeaveResult = await pool.request()
      .execute("Sp_GetShortLeavesCount"); // Stored procedure

    const shortLeaveRows = shortLeaveResult.recordset;

    for (const row of shortLeaveRows) {
      if (!finalEmployees[row.EmployeeId]) {
        finalEmployees[row.EmployeeId] = {
          id: row.EmployeeId,
          name: row.Name,
          leaves: emptyMonths(),
          shortLeaves: emptyMonths(),
          totalLeaves: 0,
          totalShortLeaves: 0
        };
      }

      MONTHS.forEach((m, i) => {
        const monthValue = row[m] || 0;
        finalEmployees[row.EmployeeId].shortLeaves[m] = monthValue;
        finalEmployees[row.EmployeeId].totalShortLeaves += monthValue;
      });
    }

    return res.json({
      year,
      employees: Object.values(finalEmployees)
    });

  } catch (err) {
    console.error("REPORT ERROR:", err);
    return res.status(500).json({ message: err.message, stack: err.stack });
  }
};
