import { poolPromise } from "../config/db.js";
import sql from "mssql";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const getYearlyLeaveReport = async (req, res) => {
  try {
    const year = req.params.year;
    if (!year) return res.status(400).json({ message: "Year is required" });

    const pool = await poolPromise;

    const emptyMonths = () => MONTHS.reduce((acc, m) => ({ ...acc, [m]: 0 }), {});

    const finalEmployees = {};

    // ============================================================
    // 1️⃣ FULL LEAVES (Dynamic Year)
    // ============================================================
    const fullLeaveQuery = `
      SELECT 
          E.EmployeeId,
          E.Name,
          ISNULL(L.Jan,0) AS Jan,
          ISNULL(L.Feb,0) AS Feb,
          ISNULL(L.Mar,0) AS Mar,
          ISNULL(L.Apr,0) AS Apr,
          ISNULL(L.May,0) AS May,
          ISNULL(L.Jun,0) AS Jun,
          ISNULL(L.Jul,0) AS Jul,
          ISNULL(L.Aug,0) AS Aug,
          ISNULL(L.Sep,0) AS Sep,
          ISNULL(L.Oct,0) AS Oct,
          ISNULL(L.Nov,0) AS Nov,
          ISNULL(L.[Dec],0) AS [Dec],
          ISNULL(L.TotalNoOfDays,0) AS TotalNoOfDays
      FROM tbl_Employees E
      LEFT JOIN (
          SELECT 
              EmployeeId,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='01' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Jan,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='02' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Feb,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='03' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Mar,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='04' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Apr,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='05' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS May,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='06' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Jun,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='07' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Jul,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='08' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Aug,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='09' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Sep,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='10' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Oct,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='11' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS Nov,
              SUM(CASE WHEN SUBSTRING(startdate, 4, 2)='12' THEN CAST(NoOfDays AS FLOAT) ELSE 0 END) AS [Dec],
              SUM(CAST(NoOfDays AS FLOAT)) AS TotalNoOfDays
          FROM tbl_LeaveDetails
          WHERE 
              NoOfDays NOT IN ('0.2','0.1')
              AND ApprovalStatus = 1
              AND EndDate LIKE '%' + @year + '%'
          GROUP BY EmployeeId
      ) L ON E.EmployeeId = L.EmployeeId
      WHERE 
          E.ActiveId = 1
          AND E.IsDeleted = 0
          AND E.EmployeeId NOT IN (6,9)
          AND YEAR(TRY_CONVERT(date, E.JoiningDate, 103)) <= @year
      ORDER BY E.Name ASC;
    `;

    const fullLeaveResult = await pool.request()
      .input("year", sql.VarChar, year)
      .query(fullLeaveQuery);

    for (const row of fullLeaveResult.recordset) {
      finalEmployees[row.EmployeeId] = {
        id: row.EmployeeId,
        name: row.Name,
        leaves: emptyMonths(),
        shortLeaves: emptyMonths(),
        totalLeaves: 0,
        totalShortLeaves: 0
      };

      MONTHS.forEach(m => {
        finalEmployees[row.EmployeeId].leaves[m] = row[m] || 0;
        finalEmployees[row.EmployeeId].totalLeaves += row[m] || 0;
      });
    }

    // ============================================================
    // 2️⃣ SHORT LEAVES (Dynamic Year)
    // ============================================================
    const shortLeaveQuery = `
      SELECT 
          E.EmployeeId,
          E.Name,
          ISNULL(L.Jan,0) AS Jan,
          ISNULL(L.Feb,0) AS Feb,
          ISNULL(L.Mar,0) AS Mar,
          ISNULL(L.Apr,0) AS Apr,
          ISNULL(L.May,0) AS May,
          ISNULL(L.Jun,0) AS Jun,
          ISNULL(L.Jul,0) AS Jul,
          ISNULL(L.Aug,0) AS Aug,
          ISNULL(L.Sep,0) AS Sep,
          ISNULL(L.Oct,0) AS Oct,
          ISNULL(L.Nov,0) AS Nov,
          ISNULL(L.[Dec],0) AS [Dec],
          ISNULL(L.DaysCount,0) AS DaysCount
      FROM tbl_Employees E
      LEFT JOIN (
          SELECT 
              EmployeeId,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='01' THEN 1 ELSE 0 END) AS Jan,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='02' THEN 1 ELSE 0 END) AS Feb,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='03' THEN 1 ELSE 0 END) AS Mar,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='04' THEN 1 ELSE 0 END) AS Apr,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='05' THEN 1 ELSE 0 END) AS May,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='06' THEN 1 ELSE 0 END) AS Jun,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='07' THEN 1 ELSE 0 END) AS Jul,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='08' THEN 1 ELSE 0 END) AS Aug,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='09' THEN 1 ELSE 0 END) AS Sep,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='10' THEN 1 ELSE 0 END) AS Oct,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='11' THEN 1 ELSE 0 END) AS Nov,
              SUM(CASE WHEN SUBSTRING(startdate,4,2)='12' THEN 1 ELSE 0 END) AS [Dec],
              COUNT(*) AS DaysCount
          FROM tbl_LeaveDetails
          WHERE 
              NoOfDays IN ('0.2','0.1')
              AND ApprovalStatus = 1
              AND EndDate LIKE '%' + @year + '%'
          GROUP BY EmployeeId
      ) L ON E.EmployeeId = L.EmployeeId
      WHERE 
          E.ActiveId = 1
          AND E.IsDeleted = 0
          AND E.EmployeeId NOT IN (6,9)
           AND YEAR(TRY_CONVERT(date, E.JoiningDate, 103)) <= @year
      ORDER BY E.Name ASC;
    `;

    const shortLeaveResult = await pool.request()
      .input("year", sql.VarChar, year)
      .query(shortLeaveQuery);

    for (const row of shortLeaveResult.recordset) {
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

      MONTHS.forEach(m => {
        finalEmployees[row.EmployeeId].shortLeaves[m] = row[m] || 0;
        finalEmployees[row.EmployeeId].totalShortLeaves += row[m] || 0;
      });
    }

    // ============================================================
    // FINAL OUTPUT
    // ============================================================
    return res.json({
      year,
      employees: Object.values(finalEmployees)
    });

  } catch (err) {
    console.error("REPORT ERROR:", err);
    return res.status(500).json({ message: err.message, stack: err.stack });
  }
};
