// controllers/employeeSalaryController.js
import { poolPromise } from "../config/db.js";

// Fetch employee salaries
export const getEmployeeSalaries = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        EmployeeId AS id,
        Name AS name,
        Designation AS role,
        CurrentSalary AS salary
      FROM tbl_Employees
      WHERE 
        IsDeleted = 0
        AND ActiveId = 1
        AND EmployeeId NOT IN (6, 9)
    `);

    // Format JSON with profile image URL
 const formattedData = result.recordset.map((emp) => ({
  id: "emp_" + emp.id,
  name: emp.name,
  role: emp.role,
  salary: emp.salary,
  profileImage: `${process.env.BASE_URL || "https://employee-dashboard-backend-api.vercel.app/api"}/employee/image/${emp.id}`
}));


    return res.status(200).json({
      success: true,
      message: "Employee salary data fetched successfully",
      data: formattedData,
    });

  } catch (error) {
    console.error("Error fetching employee salaries:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching employee salary data",
      error: error.message,
    });
  }
};

// Fetch employee image separately
export const getEmployeeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("EmployeeId", id)
      .query(`
        SELECT Picture
        FROM tbl_Employees
        WHERE EmployeeId = @EmployeeId AND IsDeleted = 0
      `);

    if (!result.recordset[0] || !result.recordset[0].Picture) {
      return res.status(404).send("Image not found");
    }

    const imageBuffer = result.recordset[0].Picture;
    res.set("Content-Type", "image/jpeg"); // or "image/png" if needed
    res.send(imageBuffer);

  } catch (error) {
    console.error("Error fetching employee image:", error);
    res.status(500).send("Server error while fetching image");
  }
};
