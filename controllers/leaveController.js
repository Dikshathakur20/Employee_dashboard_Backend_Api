import { poolPromise } from "../config/db.js";

// -------------------------------------------------------------
// 1️⃣ GET ACTIVE EMPLOYEES (exclude EmployeeId 6 & 9)
// -------------------------------------------------------------
const getActiveEmployeeIds = async () => {
  const pool = await poolPromise;

  const query = `
    SELECT EmployeeId, Name
    FROM tbl_Employees
    WHERE IsDeleted = 0
      AND ActiveId = 1
      AND EmployeeId NOT IN (6, 9);
  `;

  const result = await pool.request().query(query);
  return result.recordset;   // [{ EmployeeId, Name }]
};



// -------------------------------------------------------------
// 2️⃣ GET LEAVE REPORT (CALL STORED PROCEDURE)
// -------------------------------------------------------------
const getLeaveReportFromProcedure = async (year) => {
  const pool = await poolPromise;

  const leaveResult = await pool.request()
    .input("Year", year)
    .execute("usp_leavedetailscountForadmin");

  return leaveResult.recordset;
};



// -------------------------------------------------------------
// 3️⃣ MAIN: YEARLY LEAVE REPORT API
// -------------------------------------------------------------
export const getYearlyLeaveReport = async (req, res) => {
try {
const year = parseInt(req.params.year);
if (!year) {
return res.status(400).json({ message: "Year is required" });
}


const totalAllowedLeaves = 12;

const activeEmployees = await getActiveEmployeeIds();
const activeMap = new Map(activeEmployees.map(e => [e.EmployeeId, e.Name]));

const leaveRows = await getLeaveReportFromProcedure(year);

const filteredRows = leaveRows.filter(
  row => row.ReleaseDate === null && row.EmployeeId !== 102
);

const employees = filteredRows.map(row => {
  // Parse dd/mm/yyyy format
  let allowedLeaves = totalAllowedLeaves;
  if (row.JoiningDate) {
    const [day, month, yr] = row.JoiningDate.split("/").map(Number);
    const joiningDate = new Date(yr, month - 1, day);

    const jan1 = new Date(year, 0, 1);
    const may31 = new Date(year, 4, 31);

    if (joiningDate > may31) {
      allowedLeaves = 6; // Joined after May 31
    } else {
      allowedLeaves = 12; // Joined before or between Jan 1 and May 31
    }
  }

  return {
    name: activeMap.get(row.EmployeeId) || row.EmpName,
    allowedLeaves,
    fullLeaves: row.TotalDays ?? 0,
    shortLeaves: row.TotalShortDays ?? 0,
  };
});

return res.json({
  year,
  totalAllowedLeaves,
  employees
});


} catch (error) {
console.error("Yearly Leave Report Error:", error);
res.status(500).json({ message: "Server Error" });
}
};






