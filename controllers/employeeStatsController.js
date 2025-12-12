import sql from "mssql";
import { poolPromise } from "../config/db.js";

export const getEmployeeStats = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Get year (default = current year)
        const today = new Date();
        const year = parseInt(req.query.year) || today.getFullYear();

        // Today / Yesterday
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
            .input("Year", sql.Int, year)
            .query(`
                DECLARE @TodayDate DATE = TRY_CONVERT(date, @Today, 103);
                DECLARE @YesterdayDate DATE = TRY_CONVERT(date, @Yesterday, 103);

                ------------------------------------------------------------------
                -- ⭐ NEW FIXED PENDING LEAVE LOGIC (CTE MUST BE OUTSIDE SELECT)
                ------------------------------------------------------------------
                WITH EmpAllowed AS (
                    SELECT 
                        E.EmployeeId,
                        CASE 
                            WHEN YEAR(TRY_CONVERT(date, E.JoiningDate, 103)) < @Year THEN 12
                            WHEN YEAR(TRY_CONVERT(date, E.JoiningDate, 103)) = @Year
                                 AND MONTH(TRY_CONVERT(date, E.JoiningDate, 103)) < 6 THEN 12
                            ELSE 6
                        END AS AllowedLeaves
                    FROM tbl_Employees E
                    WHERE 
                        E.IsDeleted = 0 
                        AND E.ActiveId = 1
                        AND E.EmployeeId NOT IN (6,9)
                ),
                Approved AS (
                    SELECT 
                        L.EmployeeId,
                        SUM(CAST(L.NoOfDays AS FLOAT)) AS ApprovedFullDays
                    FROM tbl_LeaveDetails L
                    WHERE 
                        L.ApprovalStatus = 1
                        AND CAST(L.NoOfDays AS FLOAT) >= 0.5
                        AND YEAR(TRY_CONVERT(date, L.StartDate, 103)) = @Year
                    GROUP BY L.EmployeeId
                ),
                EligibleEmployees AS (
                    SELECT 
                        A.EmployeeId
                    FROM EmpAllowed A
                    LEFT JOIN Approved Ap ON A.EmployeeId = Ap.EmployeeId
                    WHERE 
                        A.AllowedLeaves - ISNULL(Ap.ApprovedFullDays, 0) > 0
                )

                ------------------------------------------------------------------
                -- ORIGINAL SELECT (UNCHANGED EXCEPT HIRING & RESIGNING YEAR FIX)
                ------------------------------------------------------------------
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

                    -- HIRED THIS YEAR ONLY (ignore month)
                    (SELECT COUNT(*)
                     FROM tbl_Employees
                     WHERE IsDeleted = 0
                       AND ActiveId = 1
                       AND YEAR(TRY_CONVERT(date, JoiningDate, 103)) = @Year
                    ) AS HiringThisYear,

                    -- RESIGNED THIS YEAR ONLY (ignore month)
                    (SELECT COUNT(*)
                     FROM tbl_Employees
                     WHERE IsDeleted = 0
                       AND ReleaseDate IS NOT NULL
                       AND YEAR(TRY_CONVERT(date, ReleaseDate, 103)) = @Year
                    ) AS ResignedThisYear,

                    -- ⭐ FIXED PENDING LEAVES QUERY USING CTE RESULT
                    (
                        SELECT COUNT(*) 
                        FROM tbl_LeaveDetails L
                        INNER JOIN EligibleEmployees EE ON EE.EmployeeId = L.EmployeeId
                        WHERE 
                            L.ApprovalStatus = 0
                            AND CAST(L.NoOfDays AS FLOAT) >= 0.5
                            AND YEAR(TRY_CONVERT(date, L.StartDate, 103)) = @Year
                    ) AS PendingLeaves
            `);

        const stats = result.recordset[0];

        const notCheckedInToday =
            stats.ActiveEmployees - stats.CheckedInToday - stats.OnLeaveToday;

        const prevNotCheckedIn =
            stats.ActiveEmployees - stats.PrevCheckedIn - stats.PrevOnLeave;

        // Final API response
        res.json({
            activeEmployees: stats.ActiveEmployees,
            checkedInToday: stats.CheckedInToday,
            notCheckedInToday: Math.max(notCheckedInToday, 0),
            onLeaveToday: stats.OnLeaveToday,
            prevCheckedIn: stats.PrevCheckedIn,
            prevNotCheckedIn: Math.max(prevNotCheckedIn, 0),
            prevOnLeave: stats.PrevOnLeave,
            pendingLeaves: stats.PendingLeaves,
            hiringThisYear: stats.HiringThisYear,
            resignedThisYear: stats.ResignedThisYear
        });

    } catch (err) {
        console.error("EMPLOYEE STATS ERROR:", err);
        res.status(500).json({
            message: "Server Error",
            error: err.message
        });
    }
};
