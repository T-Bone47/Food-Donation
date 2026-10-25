import express from "express";
import { supabase } from "../supabase.js";

const router = express.Router();

router.put("/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid donation ID" });
    }

    const { data, error } = await supabase
      .from("donations")
      .update({ status: "Volunteer Found" })
      .eq("id", id) // match UUID as string
      .select();

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ message: "Error updating status" });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json({ message: "Status updated successfully", data });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Server crashed", error: err.message });
  }
});


export default router;
