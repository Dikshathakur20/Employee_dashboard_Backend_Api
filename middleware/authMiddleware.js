import dotenv from "dotenv";
dotenv.config();

export const authMiddleware = (req, res, next) => {
  // Allow both:  authorization & Authorization
  const header = req.headers["authorization"] || req.headers["Authorization"];

  if (!header) {
    return res.status(401).json({
      status: false,
      message: "Authorization header missing"
    });
  }

  // Expected format: Bearer TOKEN
  const parts = header.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(400).json({
      status: false,
      message: "Invalid Authorization format. Use: Bearer <token>"
    });
  }

  const token = parts[1];

  // Compare with .env secret
  if (token !== process.env.API_SECRET) {
    return res.status(403).json({
      status: false,
      message: "Unauthorized: Invalid Token"
    });
  }

  // If token is correct
  next();
};
