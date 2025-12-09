import sql from "mssql";
import { poolPromise } from "../config/db.js";

export const getEmployeeStats = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Format to dd/mm/yyyy
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const formatDate = (date) => {
            const d = String(date.getDate()).padStart(2, "0");
            const m = String(date.getMonth() + 1).padStart(2, "0");
            const y = date.getFullYear();
            return `${d}/${m}/${y}`;
        };

        const todayStr = formatDate(today);
        const yesterdayStr = formatDate(yesterday);

        const result = await pool.request()
            .input("Today", sql.VarChar, todayStr)
            .input("Yesterday", sql.VarChar, yesterdayStr)
            .query(`
                DECLARE @TodayDate DATE = TRY_CONVERT(date, @Today, 103);
                DECLARE @YesterdayDate DATE = TRY_CONVERT(date, @Yesterday, 103);

                SELECT 
                    -- ACTIVE EMPLOYEES (excluding EmployeeId 6 & 9)
                    (SELECT COUNT(*) 
                     FROM tbl_Employees 
                     WHERE IsDeleted = 0 
                       AND ActiveId = 1
                       AND EmployeeId NOT IN (6, 9)
                    ) AS ActiveEmployees,

                    -- CHECKED IN TODAY (excluding EmployeeId 6 & 9)
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

                    -- CHECKED IN YESTERDAY (excluding EmployeeId 6 & 9)
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
                    ) AS PrevOnLeave;
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
            prevOnLeave: stats.PrevOnLeave
        });

    } catch (err) {
        console.error("EMPLOYEE STATS ERROR:", err);
        res.status(500).json({
            message: "Server Error",
            error: err.message
        });
    }
};
