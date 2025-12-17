import { poolPromise } from "../config/db.js";

// Helper for birthdays/anniversaries
function formatRecurringDate(dateValue, requestedYear) {
  if (!dateValue) return null;

  let day, month;

  if (typeof dateValue === "string") {
    [day, month] = dateValue.split("/");
  } else if (dateValue instanceof Date) {
    day = String(dateValue.getDate()).padStart(2, "0");
    month = String(dateValue.getMonth() + 1).padStart(2, "0");
  } else {
    return null;
  }

  return `${requestedYear}-${month}-${day}`;
}

// Parse DB date (dd/MM/yyyy) to ISO format
function parseDBDateToISO(dateStr) {
  if (!dateStr) return null;
  const [day, month, year] = dateStr.split("/").map(Number);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const getEventsCalendar = async (req, res) => {
  try {
    const { year } = req.query;
    const requestedYear = parseInt(year);
    const currentYear = new Date().getFullYear();

    if (requestedYear > currentYear) {
      return res.json({
        success: false,
        message: `Data for year ${requestedYear} cannot be shown. Only up to ${currentYear} is allowed.`,
        events: [],
      });
    }

    const pool = await poolPromise;

    // Fetch holidays
    const holidaysQuery = `
      SELECT HolidayId, FestivalName, FestivalDate
      FROM tbl_Holidays
      WHERE TRY_CONVERT(date, FestivalDate, 103) IS NOT NULL
    `;
    const holidayResult = await pool.request().query(holidaysQuery);

    // Fetch employees
    const employeesQuery = `
      SELECT EmployeeId, Name, Birthday, Aniversary, JoiningDate
      FROM tbl_Employees
      WHERE IsDeleted = 0 AND ActiveId = 1 AND EmployeeId <> 102
    `;
    const employeeResult = await pool.request().query(employeesQuery);

    const eventsMap = new Map();

    // -------------------- HOLIDAYS --------------------
    holidayResult.recordset.forEach((h) => {
      const festivalDateISO = parseDBDateToISO(h.FestivalDate);
      if (!festivalDateISO) return;

      const eventYear = parseInt(festivalDateISO.split("-")[0]);
      if (eventYear !== requestedYear) return;

      if (!eventsMap.has(festivalDateISO)) {
        eventsMap.set(festivalDateISO, {
          festivalNames: [h.FestivalName.trim()],
          ids: [h.HolidayId],
        });
      } else {
        const existing = eventsMap.get(festivalDateISO);
        if (!existing.festivalNames.includes(h.FestivalName.trim())) {
          existing.festivalNames.push(h.FestivalName.trim());
        }
        existing.ids.push(h.HolidayId);
      }
    });

    const events = [];

    eventsMap.forEach((value, date) => {
      events.push({
        id: `H-${value.ids.join("-")}`,
        title: value.festivalNames.join(" / "),
        type: "Holiday",
        date,
      });
    });

    // Base image URL (same logic as salary API)
    const baseImageUrl =
      process.env.BASE_URL ||
      "https://employee-dashboard-backend-api.vercel.app/api";

    // -------------------- EMPLOYEE EVENTS --------------------
    employeeResult.recordset.forEach((emp) => {
      const employeeImage = `${baseImageUrl}/employee/image/${emp.EmployeeId}`;

      // Birthday
      const birthdayDate = formatRecurringDate(emp.Birthday, requestedYear);
      if (birthdayDate) {
        events.push({
          id: `B-${emp.EmployeeId}`,
          title: `Birthday – ${emp.Name}`,
          type: "Event",
          date: birthdayDate,
          employeeId: emp.EmployeeId,
          employeeImage,
        });
      }

      // Anniversary
      const annDate = formatRecurringDate(emp.Aniversary, requestedYear);
      if (annDate) {
        events.push({
          id: `A-${emp.EmployeeId}`,
          title: `Anniversary – ${emp.Name}`,
          type: "Event",
          date: annDate,
          employeeId: emp.EmployeeId,
          employeeImage,
        });
      }

      // Work-year completion
      if (emp.JoiningDate) {
        const joiningYear = parseInt(emp.JoiningDate.split("/")[2]);
        const workYears = requestedYear - joiningYear;

        if (workYears > 0) {
          const workAnniversaryDate = formatRecurringDate(
            emp.JoiningDate,
            requestedYear
          );

          events.push({
            id: `W-${emp.EmployeeId}`,
            title: `${workYears} year${workYears > 1 ? "s" : ""} completed – ${emp.Name}`,
            type: "Event",
            date: workAnniversaryDate,
            employeeId: emp.EmployeeId,
            employeeImage,
          });
        }
      }
    });

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, events });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
