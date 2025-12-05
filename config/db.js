import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

// ------------------------
// 1️⃣ DB Configuration
// ------------------------
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: false,              // set true if using Azure SQL
    trustServerCertificate: true // required for self-signed certs
  }
};

// ------------------------
// 2️⃣ Create poolPromise safely
// ------------------------
export const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ MSSQL Connected");
    return pool;
  })
  .catch(err => {
    console.error("❌ DB Connection Failed:", err);
    throw err; // Important: stops execution if DB connection fails
  });

// ------------------------
// 3️⃣ Export SQL module
// ------------------------
export { sql };
