import { poolPromise } from "../config/db.js";

const timeSlots = [
  "08:30 - 09:00", "09:00 - 09:30", "09:30 - 10:00",
  "10:00 - 10:30", "10:30 - 11:00", "11:00 - 11:30"
];

function getTimeSlotIndexUTC(date) {
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  const slotRanges = [
    [510, 540], [540, 570], [570, 600],
    [600, 630], [630, 660], [660, 690]
  ];
  return slotRanges.findIndex(([start, end]) => minutes >= start && minutes < end);
}

export async function getAttendanceHeatmap(req, res) {
  try {
    const year = parseInt(req.query.year);
    const month = parseInt(req.query.month);

    if (!year || !month)
      return res.status(400).json({ message: "Year and month are required" });

    const pool = await poolPromise;

    const query = `
      SELECT CheckInTime
      FROM tbl_EmployeeCheck
      WHERE IsDeleted = 0
      AND YEAR(CheckInTime) = @year
      AND MONTH(CheckInTime) = @month
    `;

    const result = await pool
      .request()
      .input("year", year)
      .input("month", month)
      .query(query);

    const records = result.recordset;
    console.log("Records fetched:", records);

    // 1. Get all unique dates from records (ignore weekends)
    const uniqueDates = Array.from(
      new Set(
        records
          .map(r => {
            const date = new Date(r.CheckInTime);
            const day = date.getUTCDay();
            if (day === 0 || day === 6) return null; // skip Sat & Sun
            return date.toISOString().split("T")[0];
          })
          .filter(Boolean)
      )
    );

    // 2. Sort descending to get latest dates first
    uniqueDates.sort((a, b) => (a < b ? 1 : -1));

    // 3. Pick last 5 recorded days
    const last5Days = uniqueDates.slice(0, 5);

    const data = [];

    records.forEach(row => {
      if (!row.CheckInTime) return;

      const checkDate = new Date(row.CheckInTime);
      if (isNaN(checkDate)) return;

      const dateStr = checkDate.toISOString().split("T")[0];
      if (!last5Days.includes(dateStr)) return;

      const day = checkDate.getUTCDay();
      const y = getTimeSlotIndexUTC(checkDate);
      if (y === -1) return;

      const x = day - 1;

      const existing = data.find(d => d.x === x && d.y === y && d.date === dateStr);
      if (existing) {
        existing.value += 1;
      } else {
        data.push({ x, y, value: 1, date: dateStr });
      }
    });

    return res.json({
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      timeSlots,
      data
    });

  } catch (error) {
    console.error("Heatmap Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
