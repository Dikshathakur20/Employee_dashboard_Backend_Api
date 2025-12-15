import { poolPromise } from "../config/db.js";

export const getEmployeesMonthlySummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year);
    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const pool = await poolPromise;

    // ❌ IDs to skip
    const skipEmployeeIds = [102, 103, 104];

    // ✅ FILTER AT SQL LEVEL (MOST IMPORTANT)
    const query = `
      SELECT 
        EmployeeId,
        Name,
        ActiveId,
        IsDeleted,
        CONVERT(varchar, JoiningDate, 103) AS JoiningDate,
        CONVERT(varchar, ReleaseDate, 103) AS ReleaseDate
      FROM tbl_Employees
      WHERE IsDeleted = 0
        AND EmployeeId NOT IN (${skipEmployeeIds.join(",")})
    `;

    const result = await pool.request().query(query);
    const employees = result.recordset;

    // ✅ Extra safety normalization (JS level)
    const validEmployees = employees.filter(emp =>
      Number(emp.IsDeleted) === 0 &&
      !skipEmployeeIds.includes(Number(emp.EmployeeId))
    );

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlySummary = months.map((month, index) => {
      const monthNumber = index + 1;
      const resignedSet = new Set();

      // ---------------- RESIGNED ----------------
      const resignedEmployees = validEmployees.filter(emp => {
        // Case 1: Has Release Date
        if (emp.ReleaseDate) {
          const [d, m, y] = emp.ReleaseDate.split("-").map(Number);
          return y === year && m === monthNumber;
        }

        // Case 2: ActiveId = 2 → auto after 2 months
        if (emp.ActiveId == 2 && emp.JoiningDate) {
          const [jd, jm, jy] = emp.JoiningDate.split("/").map(Number);
          const autoResign = new Date(jy, jm + 1, jd);

          if (
            autoResign.getFullYear() === year &&
            autoResign.getMonth() + 1 === monthNumber &&
            !resignedSet.has(emp.EmployeeId)
          ) {
            resignedSet.add(emp.EmployeeId);
            return true;
          }
        }
        return false;
      }).map(emp => ({
        name: emp.Name,
        date: emp.ReleaseDate || "After 2 Months"
      }));

      // ---------------- JOINED ----------------
      const joinedEmployees = validEmployees.filter(emp => {
        if (!emp.JoiningDate) return false;
        const [d, m, y] = emp.JoiningDate.split("/").map(Number);
        return y === year && m === monthNumber;
      }).map(emp => ({
        name: emp.Name,
        date: emp.JoiningDate
      }));

// ---------------- TOTAL (EMPLOYEES PRESENT IN MONTH) ----------------
const totalActive = validEmployees.filter(emp => {
  if (!emp.JoiningDate) return false;

  const currentIndex = year * 12 + monthNumber;

  // JoiningDate → dd/MM/yyyy
  const [jd, jm, jy] = emp.JoiningDate.split("/").map(Number);
  const joinIndex = jy * 12 + jm;

  // ❌ Joined after this month
  if (joinIndex > currentIndex) return false;

  // ---------------- CASE 1: JoiningDate + ReleaseDate present ----------------
  if (emp.ReleaseDate) {
    // ReleaseDate → dd-MM-yyyy
    const [rd, rm, ry] = emp.ReleaseDate.split("-").map(Number);
    const releaseIndex = ry * 12 + rm;

    // ✅ Count only between joining and release
    return currentIndex < releaseIndex;
  }

  // ---------------- CASE 2: ReleaseDate NULL ----------------
  // Count ONLY if ActiveId = 1 and not deleted
  if (emp.ActiveId == 1 && Number(emp.IsDeleted) === 0) {
    return true;
  }

  // ❌ Everything else
  return false;
}).length;




      return {
        month,
        total: totalActive,
        resigned: resignedEmployees.length,
        joined: joinedEmployees.length,
        resignedEmployees,
        joinedEmployees
      };
    });

    res.json({ data: monthlySummary });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
