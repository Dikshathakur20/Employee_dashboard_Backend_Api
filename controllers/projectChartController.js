// controllers/projectChartController.js
import { poolPromise } from "../config/db.js";

export const getProjectChartData = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        ProjectID,
        ProjectName,
        ProjectImage,
        URL,
        DateofProject,
        ProjectEndDate,
        ProjectCategories,
        SmallDescription
      FROM tbl_Project
      WHERE IsDeleted = 0
        AND Publish = 1
      ORDER BY DateofProject;
    `);

    const rows = result.recordset;
    const baseUrl =
      process.env.BASE_URL ||
      "https://employee-dashboard-backend-api.vercel.app/api";

    const yearMap = {};

    rows.forEach((p) => {
      if (!p.DateofProject) return;

      const year = new Date(p.DateofProject).getFullYear().toString();
      const category = p.ProjectCategories || "Others";

      // 1️⃣ Year level
      if (!yearMap[year]) {
        yearMap[year] = {
          category: year,
          value: 0,
          subData: {}
        };
      }
      yearMap[year].value += 1;

      // 2️⃣ Category level
      if (!yearMap[year].subData[category]) {
        yearMap[year].subData[category] = {
          category,
          value: 0,
          projects: []
        };
      }
      yearMap[year].subData[category].value += 1;

      // 3️⃣ Project level
      yearMap[year].subData[category].projects.push({
        name: p.ProjectName,
        startDate: p.DateofProject,
        endDate: p.ProjectEndDate,
        url: p.URL, // stored as-is
        image: p.ProjectImage
          ? `${baseUrl}/projects/image/${p.ProjectID}`
          : null,
        smallDescription: p.SmallDescription
      });
    });

    // Convert maps to arrays
    const chartData = Object.values(yearMap).map((yearItem) => ({
      category: yearItem.category,
      value: yearItem.value,
      subData: Object.values(yearItem.subData)
    }));

    return res.status(200).json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error("Project Chart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching project chart data",
      error: error.message
    });
  }
};

// ----------------------------------------------------
// 🔹 Fetch project image (same pattern as employee image)
// ----------------------------------------------------
export const getProjectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("ProjectID", id)
      .query(`
        SELECT ProjectImage
        FROM tbl_Project
        WHERE ProjectID = @ProjectID AND IsDeleted = 0
      `);

    if (!result.recordset[0] || !result.recordset[0].ProjectImage) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", "image/jpeg");
    res.send(result.recordset[0].ProjectImage);

  } catch (error) {
    console.error("Error fetching project image:", error);
    res.status(500).send("Server error while fetching image");
  }
};
