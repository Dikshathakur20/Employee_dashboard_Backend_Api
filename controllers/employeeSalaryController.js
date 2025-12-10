// controllers/employeeSalaryController.js

import { poolPromise } from "../config/db.js";

export const getEmployeeSalaries = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        EmployeeId AS id,
        Name AS name,
        Designation AS role,
        CurrentSalary AS salary,
        Picture AS profileImage
      FROM tbl_Employees
      WHERE 
        IsDeleted = 0
        AND ActiveId = 1
        AND EmployeeId NOT IN (6, 9)
    `);

    // Format JSON like your example
    const formattedData = result.recordset.map((emp) => ({
      id: "emp_" + emp.id,
      name: emp.name,
      role: emp.role,
      salary: emp.salary,
      profileImage: emp.profileImage,
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
