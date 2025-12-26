import { poolPromise } from "../config/db.js";

const getEmployeesOnLeaveToday = async (req, res) => {
  try {
    const pool = await poolPromise;

    const query = `
      SELECT 
        e.EmployeeId,
        e.Name,
        l.NoOfDays,
        l.StartDate,
        l.EndDate
      FROM tbl_LeaveDetails l
      INNER JOIN tbl_Employees e ON e.EmployeeId = l.EmployeeId
      WHERE l.ApprovalStatus = 1
        AND CONVERT(DATETIME, l.StartDate, 103) <= 
            CONVERT(DATETIME, CONVERT(VARCHAR, SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time', 103), 103)
        AND CONVERT(DATETIME, l.EndDate, 103) >= 
            CONVERT(DATETIME, CONVERT(VARCHAR, SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time', 103), 103)
    `;

    const result = await pool.request().query(query);

    const fullLeaveEmployees = [];
    const shortLeaveEmployees = [];

    result.recordset.forEach(emp => {
      const days = parseFloat(emp.NoOfDays);

      if (days === 0.1 || days === 0.2) {
        shortLeaveEmployees.push(emp);
      } else {
        fullLeaveEmployees.push(emp);
      }
    });

    return res.status(200).json({
      success: true,
      date: "Today (IST)",
      totalEmployeesOnLeave: result.recordset.length,
      fullLeaveCount: fullLeaveEmployees.length,
      shortLeaveCount: shortLeaveEmployees.length,
      fullLeaveEmployees,
      shortLeaveEmployees
    });

  } catch (error) {
    console.error("Error fetching employees on leave today:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

export default getEmployeesOnLeaveToday;
