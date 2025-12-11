import sql from "mssql";
import { poolPromise } from "../config/db.js";

export const getEmployeeStats = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Get year and month from query params (fallback to current)
        const today = new Date();
        const month = parseInt(req.query.month) || today.getMonth() + 1; // 1-12
        const year = parseInt(req.query.year) || today.getFullYear();

        // Today and yesterday for check-in stats
        const todayDate = new Date();
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(todayDate.getDate() - 1);

        const formatDate = (date) => {
            const d = String(date.getDate()).padStart(2, "0");
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const y = date.getFullYear();
            return `${d}/${m}/${y}`;
        };

        const todayStr = formatDate(todayDate);
        const yesterdayStr = formatDate(yesterdayDate);

        const result = await pool.request()
            .input("Today", sql.VarChar, todayStr)
            .input("Yesterday", sql.VarChar, yesterdayStr)
            .input("Month", sql.Int, month)
            .input("Year", sql.Int, year)
            .query(`
                DECLARE @TodayDate DATE = TRY_CONVERT(date, @Today, 103);
                DECLARE @YesterdayDate DATE = TRY_CONVERT(date, @Yesterday, 103);

                SELECT 
                    -- ACTIVE EMPLOYEES
                    (SELECT COUNT(*) 
                     FROM tbl_Employees 
                     WHERE IsDeleted = 0 
                       AND ActiveId = 1
                       AND EmployeeId NOT IN (6, 9)
                    ) AS ActiveEmployees,

                    -- CHECKED IN TODAY
                    (SELECT COUNT(DISTINCT EmployeeId)
                     FROM tbl_EmployeeCheck
                     WHERE TRY_CONVERT(date, Dated, 103) = @TodayDate
                       AND IsDeleted = 0 
                       AND (IsLeave = 0 OR IsLeave IS NULL)
                       AND EmployeeId NOT IN (6, 9)
                    ) AS CheckedInToday,

                    -- ON LEAVE TODAY
                    (SELECT COUNT(DISTINCT EmployeeId)
                     FROM tbl_LeaveDetails
                     WHERE @TodayDate BETWEEN TRY_CONVERT(date, StartDate, 103) 
                                          AND TRY_CONVERT(date, EndDate, 103)
                       AND ApprovalStatus = 1
                    ) AS OnLeaveToday,

                    -- CHECKED IN YESTERDAY
                    (SELECT COUNT(DISTINCT EmployeeId)
                     FROM tbl_EmployeeCheck
                     WHERE TRY_CONVERT(date, Dated, 103) = @YesterdayDate
                       AND IsDeleted = 0 
                       AND (IsLeave = 0 OR IsLeave IS NULL)
                       AND EmployeeId NOT IN (6, 9)
                    ) AS PrevCheckedIn,

                    -- ON LEAVE YESTERDAY
                    (SELECT COUNT(DISTINCT EmployeeId)
                     FROM tbl_LeaveDetails
                     WHERE @YesterdayDate BETWEEN TRY_CONVERT(date, StartDate, 103)
                                              AND TRY_CONVERT(date, EndDate, 103)
                       AND ApprovalStatus = 1
                    ) AS PrevOnLeave,

                    -- HIRED THIS MONTH
                    (SELECT COUNT(*)
                     FROM tbl_Employees
                     WHERE IsDeleted = 0
                       AND ActiveId = 1
                       AND MONTH(TRY_CONVERT(date, JoiningDate, 103)) = @Month
                       AND YEAR(TRY_CONVERT(date, JoiningDate, 103)) = @Year
                    ) AS HiringThisMonth,

                    -- RESIGNED THIS MONTH
                    (SELECT COUNT(*)
                     FROM tbl_Employees
                     WHERE IsDeleted = 0
                       AND ReleaseDate IS NOT NULL
                       AND MONTH(TRY_CONVERT(date, ReleaseDate, 103)) = @Month
                       AND YEAR(TRY_CONVERT(date, ReleaseDate, 103)) = @Year
                    ) AS ResignedThisMonth;
            `);

        const stats = result.recordset[0];

        const notCheckedInToday =
            stats.ActiveEmployees - stats.CheckedInToday - stats.OnLeaveToday;

        const prevNotCheckedIn =
            stats.ActiveEmployees - stats.PrevCheckedIn - stats.PrevOnLeave;

        res.json({
            activeEmployees: stats.ActiveEmployees,
            checkedInToday: stats.CheckedInToday,
            notCheckedInToday: Math.max(notCheckedInToday, 0),
            onLeaveToday: stats.OnLeaveToday,
            prevCheckedIn: stats.PrevCheckedIn,
            prevNotCheckedIn: Math.max(prevNotCheckedIn, 0),
            prevOnLeave: stats.PrevOnLeave,
            hiringThisMonth: stats.HiringThisMonth,
            resignedThisMonth: stats.ResignedThisMonth
        });

    } catch (err) {
        console.error("EMPLOYEE STATS ERROR:", err);
        res.status(500).json({
            message: "Server Error",
            error: err.message
        });
    }
};
