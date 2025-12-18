import { poolPromise } from "../config/db.js";

export async function getAttendanceLateComing(req, res) {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);

        if (!year || !month) {
            return res.status(400).json({ message: "Year and month are required" });
        }

        const pool = await poolPromise;

        const query = `
        SELECT 
            E.EmployeeId,
            E.Name,
            COUNT(
                DISTINCT CASE 
                    WHEN CAST(C.CheckInTime AS TIME) > E.StartShiftTime
                    THEN CAST(C.CheckInTime AS DATE)
                END
            ) AS LateDays
        FROM tbl_Employees E
        LEFT JOIN tbl_EmployeeCheck C 
            ON E.EmployeeId = C.EmployeeId
            AND C.IsDeleted = 0
            AND C.IsLeave = 0
            AND YEAR(C.CheckInTime) = @year
            AND MONTH(C.CheckInTime) = @month
        WHERE 
            E.IsDeleted = 0
            AND E.ActiveId = 1
            AND E.EmployeeId NOT IN (6,9)
        GROUP BY E.EmployeeId, E.Name
        ORDER BY E.Name;
        `;

        const result = await pool.request()
            .input("year", year)
            .input("month", month)
            .query(query);

        return res.json({
            year,
            month,
            monthName: new Date(year, month - 1).toLocaleString("en", { month: "short" }),
            employees: result.recordset
        });

    } catch (err) {
        console.error("Late Attendance Error:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    }
}
