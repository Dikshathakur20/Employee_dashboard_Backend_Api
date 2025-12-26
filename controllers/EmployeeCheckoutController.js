import { poolPromise } from "../config/db.js";

// Employee Checkout API
const checkoutEmployee = async (req, res) => {
  try {
    const { employeeId, workReport } = req.body;

    if (!employeeId || !workReport) {
      return res.status(400).json({
        message: "EmployeeId and WorkReport are required",
      });
    }

    const pool = await poolPromise;

    // Check if there is already a check-in for today without checkout
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // start of tomorrow

    const queryCheck = `
      SELECT TOP 1 *
      FROM tbl_EmployeeCheck
      WHERE EmployeeId = @EmployeeId
        AND CheckOutTime IS NULL
        AND IsDeleted = 0
        AND Dated >= @Today
        AND Dated < @Tomorrow
      ORDER BY CheckInTime ASC
    `;

    const result = await pool
      .request()
      .input("EmployeeId", employeeId)
      .input("Today", today)
      .input("Tomorrow", tomorrow)
      .query(queryCheck);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "No active check-in found for today",
      });
    }

    const checkRecord = result.recordset[0];

    // Update checkout time and work report
    const updateQuery = `
      UPDATE tbl_EmployeeCheck
      SET CheckOutTime = @CheckOutTime,
          WorkReport = @WorkReport
      WHERE CheckId = @CheckId
    `;

    await pool
      .request()
      .input("CheckOutTime", new Date())
      .input("WorkReport", workReport)
      .input("CheckId", checkRecord.CheckId)
      .query(updateQuery);

    return res.status(200).json({
      message: "Checkout successful",
      data: {
        checkId: checkRecord.CheckId,
        checkInTime: checkRecord.CheckInTime,
        checkOutTime: new Date(),
        workReport,
      },
    });
  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

export default checkoutEmployee;
