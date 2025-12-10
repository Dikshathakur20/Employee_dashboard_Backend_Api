import { poolPromise } from "../config/db.js";

export const getDesignationEmployeeTree = async (req, res) => {
  try {
    const pool = await poolPromise;

    // Fetch employees who are active and not deleted
    const result = await pool.request().query(`
      SELECT Name, Designation
      FROM tbl_Employees
      WHERE IsDeleted = 0 AND ActiveId = 1
      ORDER BY Designation, Name
    `);

    const employees = result.recordset;

    // Group by designation
    const tree = {};
    employees.forEach(emp => {
      const desig = emp.Designation || "Unknown";
      if (!tree[desig]) {
        tree[desig] = [];
      }
      tree[desig].push(emp.Name);
    });

    // Format response like your example, replacing 'department' key with 'designation'
    const designations = Object.keys(tree).map(designation => ({
      designation: designation,
      count: tree[designation].length,
      employees: tree[designation]
    }));

    return res.status(200).json({
      status: true,
      message: "Designation-wise employee data fetched successfully",
      totalEmployees: employees.length,
      designations   // ✅ return the array here
    });

  } catch (error) {
    console.error("Error fetching employee tree:", error);
    return res.status(500).json({
      status: false,
      message: "Server error while fetching employee tree",
      error: error.message
    });
  }
};
