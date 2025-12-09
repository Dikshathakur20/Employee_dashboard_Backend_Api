import { poolPromise } from "../config/db.js";

// Full-day time slots (08:30 AM → 08:00 PM)
const timeSlots = [
  "08:30 - 09:00", "09:00 - 09:30", "09:30 - 10:00",
  "10:00 - 10:30", "10:30 - 11:00", "11:00 - 11:30",
  "11:30 - 12:00", "12:00 - 12:30", "12:30 - 13:00",
  "13:00 - 13:30", "13:30 - 14:00", "14:00 - 14:30",
  "14:30 - 15:00", "15:00 - 15:30", "15:30 - 16:00",
  "16:00 - 16:30", "16:30 - 17:00", "17:00 - 17:30",
  "17:30 - 18:00", "18:00 - 18:30", "18:30 - 19:00",
  "19:00 - 19:30", "19:30 - 20:00"
];

// Convert time to slot index
function getTimeSlotIndex(date) {
  const minutes = date.getHours() * 60 + date.getMinutes();

  const slotRanges = [
    [510, 540], [540, 570], [570, 600],
    [600, 630], [630, 660], [660, 690],
    [690, 720], [720, 750], [750, 780],
    [780, 810], [810, 840], [840, 870],
    [870, 900], [900, 930], [930, 960],
    [960, 990], [990, 1020], [1020, 1050],
    [1050, 1080], [1080, 1110], [1110, 1140],
    [1140, 1170], [1170, 1200]
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

    // Dynamically build heatmap only for slots with records
    const data = [];

    records.forEach((row) => {
      if (!row.CheckInTime) return;

      const checkDate = new Date(row.CheckInTime);
      if (isNaN(checkDate)) return;

      const day = checkDate.getDay(); // 0=Sun, 1=Mon
      if (day === 0 || day === 6) return; // Skip weekends

      const x = day - 1; // Mon=0
      const y = getTimeSlotIndex(checkDate);
      if (y === -1) return; // Skip times outside defined slots

      // Find existing slot
      const existing = data.find(d => d.x === x && d.y === y);
      if (existing) {
        existing.value += 1;
      } else {
        data.push({
          x,
          y,
          value: 1,
          date: checkDate.toISOString().split("T")[0]
        });
      }
    });

    return res.json({
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      timeSlots,
      data,
    });

  } catch (error) {
    console.error("Heatmap Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
