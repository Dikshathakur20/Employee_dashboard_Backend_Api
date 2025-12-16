// authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// ✅ Allow multiple emails
const ALLOWED_EMAILS = ["info@antheminfotech.com", "nandani@antheminfotech.com"];

export const authMiddleware = (req, res, next) => {
  console.log("🔐 Auth middleware hit");

  try {
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token;

    console.log("📌 Authorization Header:", authHeader);
    console.log("📌 Query Token:", queryToken);

    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log("✅ Token extracted from HEADER");
    } else if (queryToken) {
      token = queryToken;
      console.log("✅ Token extracted from QUERY");
    } else {
      console.log("❌ No token found");
      return res.status(401).json({ message: "Token is required" });
    }

    console.log("🧪 Final Token:", token);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log("✅ Token verified successfully");
      console.log("📦 Decoded Payload:", decoded);
    } catch (jwtError) {
      console.log("❌ JWT verification failed:", jwtError.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (!decoded.email) {
      console.log("❌ Email missing in token payload");
      return res.status(403).json({ message: "Email not present in token" });
    }

    // ✅ Check if email is in allowed list
    if (!ALLOWED_EMAILS.includes(decoded.email.trim().toLowerCase())) {
      console.log("❌ Email mismatch");
      console.log("Token Email:", decoded.email);
      console.log("Allowed Emails:", ALLOWED_EMAILS.join(", "));
      return res.status(403).json({ message: "You don't have access" });
    }

    console.log("✅ Email authorized");

    req.user = decoded;
    console.log("🚀 Access granted\n");

    next();
  } catch (err) {
    console.log("🔥 Unexpected Auth Error:", err.message);
    return res.status(500).json({ message: "Authentication failed" });
  }
};
