// login.js
import express from "express";
import { supabase } from "../supabase.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

  if (error) return res.status(500).json({ message: error.message });

  if (!users || users.length === 0) {
    return res.status(400).json({ message: "User not found" });
  }

  const user = users[0];
  if (!user.password_hash) {
    return res.status(500).json({ message: "Password not set for this user" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Incorrect password" });
  }

  // ✅ Send user data instead of JWT
  return res.json({
    success: true,
    message: "Login successful",
    userId: user.id,
    email: user.email,
    role: user.role,
  });
});

export default router;
