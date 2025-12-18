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
        SubCategories,
        SmallDescription
      FROM tbl_Project
      WHERE IsDeleted = 0
        AND Publish = 1
      ORDER BY DateofProject;
    `);

    const rows = result.recordset;

    const baseUrl =
      process.env.BASE_URL || "http://localhost:5000/api";

    const yearMap = {};

    rows.forEach((p) => {
  if (!p.DateofProject) return;

  const year = new Date(p.DateofProject).getFullYear().toString();

  // ✅ TECHNOLOGY-BASED CATEGORY
  const technology = p.SubCategories || "Others";

  // Year level
  if (!yearMap[year]) {
    yearMap[year] = {
      category: year,
      value: 0,
      subData: {}
    };
  }
  yearMap[year].value++;

  // Technology level
  if (!yearMap[year].subData[technology]) {
    yearMap[year].subData[technology] = {
      category: technology,
      value: 0,
      projects: []
    };
  }
  yearMap[year].subData[technology].value++;

  // Project level
  yearMap[year].subData[technology].projects.push({
    name: p.ProjectName,
    startDate: p.DateofProject,
    endDate: p.ProjectEndDate,
    url: p.URL,
    image: p.ProjectImage
      ? `${baseUrl}/projects/image/${p.ProjectID}`
      : null,
    smallDescription: p.SmallDescription
  });
});

    const chartData = Object.values(yearMap).map((y) => ({
      category: y.category,
      value: y.value,
      subData: Object.values(y.subData)
    }));

    return res.status(200).json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error("Project Chart Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ------------------------------------------------
// Project Image API
// ------------------------------------------------
export const getProjectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("ProjectID", id)
      .query(`
        SELECT ProjectImage
        FROM tbl_Project
        WHERE ProjectID = @ProjectID
          AND IsDeleted = 0
      `);

    if (!result.recordset[0]?.ProjectImage) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", "image/jpeg");
    res.send(result.recordset[0].ProjectImage);

  } catch (error) {
    console.error("Project Image Error:", error);
    res.status(500).send("Server error");
  }
};
