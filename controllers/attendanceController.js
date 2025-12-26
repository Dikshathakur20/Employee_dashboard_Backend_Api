import { poolPromise } from "../config/db.js";

export async function getAttendanceLateComing(req, res) {
  try {
    const year = Number(req.query.year);

    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const pool = await poolPromise;

    const query = `
      SELECT
        E.EmployeeId,
        E.Name,
        MONTH(C.CheckInTime) AS MonthNo,
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
      WHERE
        E.IsDeleted = 0
        AND E.ActiveId = 1
        AND E.EmployeeId NOT IN (6, 9)
        AND TRY_CONVERT(DATE, E.JoiningDate, 103)
            <= EOMONTH(DATEFROMPARTS(@year, 12, 1))
      GROUP BY
        E.EmployeeId,
        E.Name,
        MONTH(C.CheckInTime)
      ORDER BY E.Name;
    `;

    const result = await pool
      .request()
      .input("year", year)
      .query(query);

    const monthMap = {
      1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
      5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
      9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    };

    const employeesMap = {};

    result.recordset.forEach(row => {
      if (!employeesMap[row.EmployeeId]) {
        employeesMap[row.EmployeeId] = {
          EmployeeId: row.EmployeeId,
          Name: row.Name,
          monthlyLateDays: {
            Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
            Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
          },
          totalLateDays: 0
        };
      }

      if (row.MonthNo) {
        const monthName = monthMap[row.MonthNo];
        employeesMap[row.EmployeeId].monthlyLateDays[monthName] = row.LateDays;
        employeesMap[row.EmployeeId].totalLateDays += row.LateDays;
      }
    });

    return res.json({
      year,
      employees: Object.values(employeesMap)
    });

  } catch (err) {
    console.error("Yearly Late Summary Error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
}
