import { poolPromise } from "../config/db.js";

// API function to get attendance late coming
export async function getAttendanceLateComing(req, res) {
try {
const year = parseInt(req.query.year, 10);
const month = parseInt(req.query.month, 10);


    if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
    }

    const pool = await poolPromise;

    // 1️⃣ Fetch all active employees excluding EmployeeId 6 and 9
    const employeesQuery = `
        SELECT EmployeeId, Name
        FROM tbl_Employees
        WHERE IsDeleted = 0 AND ActiveId = 1
          AND EmployeeId NOT IN (6, 9)
    `;
    const employees = (await pool.request().query(employeesQuery)).recordset;

    if (employees.length === 0) {
        return res.json({
            year,
            month,
            monthName: new Date(year, month - 1).toLocaleString('en', { month: 'short' }),
            employees: []
        });
    }

    const employeeIds = employees.map(e => e.EmployeeId);

    // 2️⃣ Fetch late check-ins per employee per day
    const checksQuery = `
        SELECT EmployeeId, CAST(CheckInTime AS DATE) AS CheckDate
        FROM tbl_EmployeeCheck
        WHERE IsDeleted = 0
          AND EmployeeId IN (${employeeIds.map((_, i) => `@id${i}`).join(",")})
          AND MONTH(CheckInTime) = @month
          AND YEAR(CheckInTime) = @year
          AND CONVERT(TIME, CheckInTime) > '09:00:00'
        GROUP BY EmployeeId, CAST(CheckInTime AS DATE)
    `;

    const request = pool.request()
        .input("month", month)
        .input("year", year);
    employeeIds.forEach((id, i) => {
        request.input(`id${i}`, id);
    });

    const checks = (await request.query(checksQuery)).recordset;

    // 3️⃣ Count late days per employee
    const lateMap = {};
    checks.forEach(c => {
        lateMap[c.EmployeeId] = (lateMap[c.EmployeeId] || 0) + 1;
    });

    // 4️⃣ Build JSON response including employees with 0 late days
    const result = employees.map(emp => ({
        name: emp.Name,
        lateDays: lateMap[emp.EmployeeId] || 0
    }));

    return res.json({
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleString('en', { month: 'short' }),
        employees: result
    });

} catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
}


}
