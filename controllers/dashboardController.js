import { poolPromise } from "../config/db.js";


// -------------------------------------------------------------
// 1️⃣ GET ACTIVE EMPLOYEES (from tbl_Employees only)
// -------------------------------------------------------------
const parseDate = (dateStr) => {
  if (!dateStr) return null;

  // Try creating a Date directly
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // Replace '/' with '-' to standardize
  const str = dateStr.replace(/\//g, '-');

  // Detect DD-MM-YYYY or DD-MM-YY
  const parts = str.split('-');
  if (parts.length === 3) {
    let day, month, year;

    // If first part > 31, assume YYYY-MM-DD
    if (Number(parts[0]) > 31) {
      [year, month, day] = parts;
    } else {
      [day, month, year] = parts;
      // If year is 2 digits, convert to 2000+year
      if (year.length === 2) year = '20' + year;
    }

    // JS Date uses 0-indexed months
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null; // fallback
};

const getActiveEmployees = async () => {
  const pool = await poolPromise;

  const query = `
    SELECT EmployeeId, Name, JoiningDate
    FROM tbl_Employees
    WHERE IsDeleted = 0
      AND ActiveId = 1
      AND JoiningDate IS NOT NULL
      AND JoiningDate != '';
  `;

  const result = await pool.request().query(query);
  const now = new Date();

  return result.recordset.map(emp => {
    const start = parseDate(emp.JoiningDate);

    if (!start) {
      return {
        name: emp.Name,
        experience: "N/A"
      };
    }

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 1) {
      return {
        name: emp.Name,
        experience: `${months} months`
      };
    } else if (months === 0) {
      return {
        name: emp.Name,
        experience: `${years} years`
      };
    } else {
      return {
        name: emp.Name,
        experience: `${years} years ${months} months`
      };
    }
  });
};




// -------------------------------------------------------------
// 2️⃣ DAILY REPORT — TODAY CHECK-IN COUNT (excluding EmployeeId 6 & 9)
// -------------------------------------------------------------
const getDailyReport = async () => {
  const pool = await poolPromise;

  const today = new Date().toISOString().split("T")[0];

  // Today check-in employees
  const checkInQuery = `
    SELECT DISTINCT EmployeeId
    FROM tbl_EmployeeCheck
    WHERE CAST(Dated AS DATE) = '${today}'
      AND IsDeleted = 0;
  `;
  const checkedInResult = await pool.request().query(checkInQuery);

  // Total Active Employees excluding EmployeeId 6 & 9
  const totalActiveQuery = `
    SELECT COUNT(*) AS totalActive
    FROM tbl_Employees
    WHERE IsDeleted = 0
      AND ActiveId = 1
      AND EmployeeId NOT IN (6, 9);
  `;
  const totalResult = await pool.request().query(totalActiveQuery);

  const totalActive = totalResult.recordset[0]?.totalActive || 0;

  return {
    checkedIn: checkedInResult.recordset.length,
    notCheckedIn: totalActive - checkedInResult.recordset.length
  };
};


// -------------------------------------------------------------
// 3️⃣ PREVIOUS DAY REPORT (excluding EmployeeId 6 & 9)
// -------------------------------------------------------------
const getPreviousDayReport = async () => {
  const pool = await poolPromise;

  // Step 1: Load all holiday dates from DB
  const holidayQuery = `
    SELECT FestivalDate
    FROM tbl_Holidays
    WHERE IsDeleted = 0
  `;
  const holidayResult = await pool.request().query(holidayQuery);

  // Convert holiday dates into a Set for fast lookup
  const holidaySet = new Set(
    holidayResult.recordset.map(h => 
      new Date(h.FestivalDate).toISOString().split("T")[0]
    )
  );

  // Step 2: Start from yesterday and go backwards until a working day
  let prev = new Date();
  prev.setDate(prev.getDate() - 1);

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 6 || day === 0; // Saturday(6) or Sunday(0)
  };

  const isHoliday = (date) => {
    const formatted = date.toISOString().split("T")[0];
    return holidaySet.has(formatted);
  };

  // Keep going back until we find a working day
  while (isWeekend(prev) || isHoliday(prev)) {
    prev.setDate(prev.getDate() - 1);
  }

  const formattedPrev = prev.toISOString().split("T")[0];

  // Step 3: Fetch check-ins from last valid working day
  const checkInQuery = `
    SELECT DISTINCT EmployeeId
    FROM tbl_EmployeeCheck
    WHERE CAST(Dated AS DATE) = '${formattedPrev}'
      AND IsDeleted = 0;
  `;
  const prevDayResult = await pool.request().query(checkInQuery);

  // Step 4: Total active employees except 6 & 9
  const totalActiveQuery = `
    SELECT COUNT(*) AS totalActive
    FROM tbl_Employees
    WHERE IsDeleted = 0
      AND ActiveId = 1
      AND EmployeeId NOT IN (6, 9);
  `;
  const totalResult = await pool.request().query(totalActiveQuery);

  const totalActive = totalResult.recordset[0]?.totalActive || 0;

  return {
    date: prev.toDateString(),
    checkedIn: prevDayResult.recordset.length,
    notCheckedIn: totalActive - prevDayResult.recordset.length
  };
};




// -------------------------------------------------------------
// 4️⃣ MAIN: DASHBOARD SUMMARY
// -------------------------------------------------------------
export const getDashboardSummary = async (req, res) => {
  try {
    const activeEmployees = await getActiveEmployees();
    const dailyReport = await getDailyReport();
    const previousDayReport = await getPreviousDayReport();

    return res.json({
      activeEmployees,
      dailyReport,
      previousDayReport
    });

  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
