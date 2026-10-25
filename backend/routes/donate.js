// donate.js
import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.post("/donate", async (req, res) => {
  try {
    const {
      user_id,
      type,
      quantity,
      preparedTime,
      pincode,
      area,
      state,
      country,
    } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { data, error } = await supabase
      .from("donations")
      .insert([
        {
          user_id,
          food_type: type,
          quantity,
          prepared_time: preparedTime,
          pincode,
          area,
          state,
          country,
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ donation: data[0] });
  } catch (err) {
    console.error("Error inserting donation:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
