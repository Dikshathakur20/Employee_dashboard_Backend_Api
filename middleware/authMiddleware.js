import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const authMiddleware = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ message: "Token is required in URL" });
  }

  if (token !== process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Invalid token" });
  }

  next();
};
