// authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ALLOWED_EMAIL = "info@antheminfotech.com"; // only this email is allowed

export const authMiddleware = (req, res, next) => {
  try {
    // 1️⃣ Get token from query parameter only
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({ message: "Token is required in query params" });
    }

    // 2️⃣ Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3️⃣ Check email
    if (decoded.email !== ALLOWED_EMAIL) {
      return res.status(403).json({ message: "You don't have access" });
    }

    // 4️⃣ Attach decoded payload to request
    req.user = decoded;

    next(); // allow access
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
