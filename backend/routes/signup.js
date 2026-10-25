import express from "express";
import { supabase } from "../supabase.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Signup Route: Handles user registration and stores location data
router.post("/signup", async (req, res) => {
  try {
    const { name, email, organization, password, phonenumber, role, area, pincode, state, country } = req.body;

    // Check if the user already exists
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user into the 'users' table, including location data
    const { data: userData, error: insertError } = await supabase
      .from("users")
      .insert([{ 
        name, 
        email, 
        password_hash: hashedPassword, 
        organization, 
        phonenumber, 
        role,
        area,
        pincode,
        state,
        country
      }]);

    if (insertError) {
      return res.status(400).json({ message: insertError.message });
    }

    res.status(200).json({ message: "User Registered Successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error!" });
  }
});

export default router;