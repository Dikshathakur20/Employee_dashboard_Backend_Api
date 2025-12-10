// controllers/employeeImageController.js
import { poolPromise } from "../config/db.js";

export const getEmployeeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("EmployeeId", id)
      .query("SELECT Picture AS profileImage FROM tbl_Employees WHERE EmployeeId = @EmployeeId AND IsDeleted = 0");

    if (result.recordset.length === 0 || !result.recordset[0].profileImage) {
      return res.status(404).send("Image not found");
    }

    const imageBuffer = result.recordset[0].profileImage;

    // Assuming the image is stored as binary in DB
    res.writeHead(200, {
      'Content-Type': 'image/jpeg', // change if your images are PNG or other
      'Content-Length': imageBuffer.length
    });
    res.end(imageBuffer);

  } catch (error) {
    console.error("Error fetching employee image:", error);
    res.status(500).send("Server error while fetching image");
  }
};
