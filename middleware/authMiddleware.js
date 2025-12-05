import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const authMiddleware = (req, res, next) => {
  const token = req.query.token; // token comes only from URL

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // attach user if token is valid
    } catch (err) {
      console.warn("Invalid or expired token, continuing without user");
    }
  }

  // proceed regardless of token
  next();
};
