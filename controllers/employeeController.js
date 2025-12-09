import sql from "mssql";
import { poolPromise } from "../config/db.js";

export const getAvailableYears = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Query distinct years from Creation field (dd/mm/yyyy format)
        const result = await pool.request().query(`
            SELECT DISTINCT YEAR(TRY_CONVERT(DATE, Creation, 103)) AS Year
            FROM tbl_Employees
            WHERE Creation IS NOT NULL 
              AND TRY_CONVERT(DATE, Creation, 103) IS NOT NULL
            ORDER BY Year ASC
        `);

        const years = result.recordset.map(row => row.Year);

        res.json({
            availableYears: years
        });
    } catch (err) {
        console.error("AVAILABLE YEARS ERROR:", err);
        res.status(500).json({
            message: "Server Error",
            error: err.message
        });
    }
};
