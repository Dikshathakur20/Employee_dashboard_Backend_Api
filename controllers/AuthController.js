import { poolPromise } from "../config/db.js";
import jwt from "jsonwebtoken";

const loginEmployee = async (req, res) => {
  try {
    const { officeEmail, password } = req.body;

    if (!officeEmail || !password) {
      return res.status(400).json({
        message: "Office Email and Password are required"
      });
    }

    const pool = await poolPromise;

    const query = `
      SELECT *
      FROM tbl_Employees
      WHERE OfficeEmail = @OfficeEmail
        AND ActiveId = 1
        AND IsDeleted = 0
    `;

    const result = await pool
      .request()
      .input("OfficeEmail", officeEmail)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        message: "User not found or inactive"
      });
    }

    const employee = result.recordset[0];

    // Password generation
    const last3EmpCode = employee.EmpCode?.slice(-3);
    const last4Phone = employee.ContactNumber?.slice(-4);
    const birthYear = new Date(employee.Birthday).getFullYear();

    const generatedPassword = `${last3EmpCode}#${last4Phone}@${birthYear}`;

    if (password !== generatedPassword) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    // 🔐 CREATE JWT TOKEN
    const token = jwt.sign(
      {
        employeeId: employee.EmployeeId,
        officeEmail: employee.OfficeEmail,
        userType: employee.UserType
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token, // 👈 TOKEN ADDED HERE
      data: {
        employeeId: employee.EmployeeId,
        empCode: employee.EmpCode,
        name: employee.Name,
        officeEmail: employee.OfficeEmail,
        designation: employee.Designation,
        userType: employee.UserType,
        isFirstTimeLogin: employee.IsFirstTimeLogin
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
};

export default loginEmployee;
