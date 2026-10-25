// routes/mydonations.js
import express from "express";
import {supabase} from "../supabase.js";

const router = express.Router();

// Get all donations of a donor (past + current)
router.get("/mydonations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("donations")
      .select("*")
      .eq("user_id", userId)   // ✅ match foreign key, not donation id
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
