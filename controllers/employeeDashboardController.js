import { poolPromise } from "../config/db.js";

export const getEmployeesMonthlySummary = async (req, res) => {
  try {
    const year = req.query.year;
    if (!year) return res.status(400).json({ message: "Year is required" });

    const pool = await poolPromise;

    const query = `
      SELECT 
        EmployeeId,
        Name,
        ActiveId,
        IsDeleted,
        CONVERT(varchar, JoiningDate, 103) as JoiningDate,
        CONVERT(varchar, ReleaseDate, 103) as ReleaseDate
      FROM tbl_Employees
    `;

    const result = await pool.request().query(query);
    const employees = result.recordset;

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlySummary = months.map((month, index) => {
      const monthNumber = index + 1;

      // ---------------------------
      // RESIGNED EMPLOYEE LOGIC
      // ---------------------------
      // Track already counted resigned employees
      // Track resigned employees already counted
const countedResigned = new Set();

const resignedEmployees = employees
  .filter(emp => {

    // ------------------------------
    // Case 1: Employees with ReleaseDate
    // ------------------------------
    if (emp.ReleaseDate) {
      const [d, m, y] = emp.ReleaseDate.split("-").map(Number);

      return y === parseInt(year) && m === monthNumber;
    }

    // ------------------------------
    // Case 2: ActiveId = 2 → resigned without ReleaseDate
    // Show them ONLY after 2 months of Joining Date
    // ------------------------------
    if (emp.ActiveId == 2 && emp.JoiningDate) {
      const [jDay, jMon, jYr] = emp.JoiningDate.split("/").map(Number);
      const jDate = new Date(jYr, jMon - 1, jDay);
      const twoMonthsAfterJoining = new Date(jYr, jMon + 1, jDay); // +2 months

      // Employee should appear only in the month when 2 months are completed
      if (
        twoMonthsAfterJoining.getFullYear() === parseInt(year) &&
        twoMonthsAfterJoining.getMonth() + 1 === monthNumber
      ) {
        if (!countedResigned.has(emp.EmployeeId)) {
          countedResigned.add(emp.EmployeeId);
          return true;
        }
      }
    }

    return false;
  })
  .map(emp => ({
    name: emp.Name,
    date: emp.ReleaseDate || " After 2 Months"
  }));


      // ---------------------------
      // JOINED EMPLOYEES
      // ---------------------------
      const joinedEmployees = employees
        .filter(emp => {
          if (!emp.JoiningDate) return false;
          const [d, m, y] = emp.JoiningDate.split("/").map(Number);
          return y === parseInt(year) && m === monthNumber;
        })
        .map(emp => ({ name: emp.Name, date: emp.JoiningDate }));


      // ---------------------------
      // TOTAL ACTIVE EMPLOYEES
      // ---------------------------
      const totalActive = employees.filter(emp => {
        // ❌ Skip inactive or deleted employees
        if (emp.ActiveId == 2 || emp.IsDeleted == 1) return false;

        if (!emp.JoiningDate) return false;

        const [jDay, jMon, jYr] = emp.JoiningDate.split("/").map(Number);

        // Skip if joined AFTER this month
        if (
          jYr > parseInt(year) ||
          (jYr === parseInt(year) && jMon > monthNumber)
        ) {
          return false;
        }

        // Check release date
        if (emp.ReleaseDate) {
          const [rDay, rMon, rYr] = emp.ReleaseDate.split("/").map(Number);

          // Skip if resigned BEFORE or IN this month
          if (
            rYr < parseInt(year) ||
            (rYr === parseInt(year) && rMon <= monthNumber)
          ) {
            return false;
          }
        }

        return true; 
      }).length;


      return {
        month,
        total: totalActive,
        resigned: resignedEmployees.length,
        joined: joinedEmployees.length,
        resignedEmployees,
        joinedEmployees
      };
    });

    res.json({ data: monthlySummary });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
