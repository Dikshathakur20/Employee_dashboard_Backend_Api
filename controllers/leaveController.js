import { poolPromise } from "../config/db.js";

// Convert "DD/MM/YYYY" → JS Date object
function parseDDMMYYYY(dateString) {
if (!dateString) return null;
const [day, month, year] = dateString.split('/').map(Number);
return new Date(year, month - 1, day);
}

export async function getLeaveSummary(year) {
const pool = await poolPromise;
const yearInt = parseInt(year, 10);


// 1️⃣ Fetch active employees (skip Ids 6 & 9)
const employeesQuery = `
    SELECT EmployeeId, Name, JoiningDate
    FROM tbl_Employees
    WHERE IsDeleted = 0
      AND ActiveId = 1
      AND EmployeeId NOT IN (6, 9)
      AND JoiningDate IS NOT NULL
`;
const employees = (await pool.request().query(employeesQuery)).recordset;

if (employees.length === 0) return { year: yearInt, employees: [] };

// 2️⃣ Fetch leave counts for all employees in ONE query
const employeeIds = employees.map(e => e.EmployeeId);
const leavesQuery = `
    SELECT EmployeeId,
           SUM(CASE WHEN NoOfDays >= 1 THEN 1 ELSE 0 END) AS FullLeaves,
           SUM(CASE WHEN NoOfDays < 1 THEN 1 ELSE 0 END) AS ShortLeaves
    FROM tbl_LeaveDetails
    WHERE EmployeeId IN (${employeeIds.join(',')})
      AND ApprovalStatus = 1
      AND Source = 'Website'
      AND TRY_CONVERT(date, StartDate, 103) IS NOT NULL
      AND YEAR(TRY_CONVERT(date, StartDate, 103)) = @year
    GROUP BY EmployeeId
`;
const leavesResult = (await pool.request()
    .input("year", yearInt)
    .query(leavesQuery)).recordset;

// Map leaves by EmployeeId for fast lookup
const leaveMap = {};
leavesResult.forEach(l => {
    leaveMap[l.EmployeeId] = {
        fullLeaves: l.FullLeaves || 0,
        shortLeaves: l.ShortLeaves || 0
    };
});

// 3️⃣ Build final employee summaries
const employeeSummaries = employees.map(emp => {
    const joiningDate = parseDDMMYYYY(emp.JoiningDate);
    if (!joiningDate || isNaN(joiningDate.getTime())) {
        console.log("Skipping invalid JoiningDate:", emp.JoiningDate);
        return null;
    }

    const joiningYear = joiningDate.getFullYear();
    const joiningMonth = joiningDate.getMonth() + 1;

    let allowedLeaves = 12;
    if (joiningYear === yearInt) {
        allowedLeaves = joiningMonth >= 6 ? 6 : 12;
    } else if (joiningYear > yearInt) {
        return null; // Joined after selected year
    }

    const leaveData = leaveMap[emp.EmployeeId] || { fullLeaves: 0, shortLeaves: 0 };

    return {
        name: emp.Name,
        allowedLeaves,
        fullLeaves: leaveData.fullLeaves,
        shortLeaves: leaveData.shortLeaves
    };
});

return {
    year: yearInt,
    employees: employeeSummaries.filter(e => e !== null)
};


}
