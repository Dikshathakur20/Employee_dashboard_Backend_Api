import { poolPromise } from "../config/db.js";

export const getEventsCalendar = async (req, res) => {
  try {
    const { year } = req.query;
    const pool = await poolPromise;
    const yearInt = parseInt(year);

    // Get all holidays safely
    const holidaysQuery = `
      SELECT HolidayId, FestivalName, FestivalDate
      FROM tbl_Holidays
      WHERE TRY_CONVERT(date, FestivalDate) IS NOT NULL
    `;
    const holidayResult = await pool.request().query(holidaysQuery);

    // Get all employees
    const employeesQuery = `
      SELECT EmployeeId, Name, Birthday, Aniversary
      FROM tbl_Employees
      WHERE IsDeleted = 0 AND ActiveId = 1 AND EmployeeId <> 102
    `;
    const employeeResult = await pool.request().query(employeesQuery);

    const events = [];

    // Holidays
    holidayResult.recordset.forEach((h) => {
      const date = new Date(h.FestivalDate);
      events.push({
        id: `H-${h.HolidayId}`,
        title: h.FestivalName,
        type: "Holiday",
        // Use the requested year but keep the original month/day
        date: `${yearInt}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
      });
    });

    // Birthdays
    // Birthdays
employeeResult.recordset.forEach((emp) => {
  if (emp.Birthday) {
    const d = new Date(emp.Birthday);
    events.push({
      id: `B-${emp.EmployeeId}`,
      title: `Birthday – ${emp.Name}`, // updated format
      type: "Event",
      date: `${yearInt}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    });
  }

  // Anniversary
  if (emp.Aniversary) {
    try {
      const [day, month] = emp.Aniversary.split("/"); // ignore year
      const d = new Date(`${yearInt}-${month}-${day}`);
      events.push({
        id: `A-${emp.EmployeeId}`,
        title: `Anniversary – ${emp.Name}`, // updated format
        type: "Event",
        date: `${yearInt}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      });
    } catch (err) {
      console.warn(`Invalid Anniversary format for EmployeeId ${emp.EmployeeId}: ${emp.Aniversary}`);
    }
  }
});

    res.json({ success: true, events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
