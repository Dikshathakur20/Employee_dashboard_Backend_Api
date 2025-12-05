import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Fake user data (since we are not inside DB controller)
const fakeUserId = "1234567890abcdef"; // put any string here

const token = jwt.sign(
  { userId: fakeUserId, role: "admin" },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

console.log("Generated Token:\n", token);
