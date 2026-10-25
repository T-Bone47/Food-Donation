// volunteeerdash.js
import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.get("/donations", async (req, res) => {
  try {
    // ✅ Get userId from request header
    const userId = req.headers["userid"];
    if (!userId) {
      return res.status(401).json({ message: "No userId provided" });
    }

    // 1. Get the user's location data from the 'users' table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("area, pincode, state")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const { area, pincode, state } = userData;

    // 2. Fetch donations near user
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("id, food_type, quantity, prepared_time, pincode, area, state, status")
      .or(`pincode.eq.${pincode}, area.ilike.%${area}%, state.ilike.%${state}%`)
      .eq("status", "Need-Volunteer");

    if (donationsError) {
      return res.status(500).json({ message: donationsError.message });
    }

    res.status(200).json(donations);
  } catch (err) {
    res.status(500).json({ message: "Server error!" });
  }
});

export default router;
