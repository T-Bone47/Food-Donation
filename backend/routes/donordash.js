import express from 'express';
import cors from 'cors';
import {supabase} from '../supabase.js';

const router = express.Router();

// Middleware
router.use(cors());
router.use(express.json());

// Route
// Get single user by email
router.get('/userdata/:email', async (req, res) => {
  const { email } = req.params;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single(); // ensure only one row

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.get("/sum-accepted", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("donations")
      .select("quantity")
      .eq("status", "Volunteer Found");

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Error fetching data" });
    }

    // Sum on the server side
    const totalSum = data.reduce((sum, row) => sum + Number(row.quantity), 0);

    // Send the result to frontend
    return res.json({ totalSum });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Count Volunteers
router.get("/count-volunteer", async (req, res) => {
  try {
    const { count, error } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "Volunteer");

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Error fetching volunteers count" });
    }

    return res.json({ volunteerCount: count });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Count Active Donations
router.get("/count-active-donation", async (req, res) => {
  try {
    const { count, error } = await supabase
      .from("donations") // ✅ make sure table name matches your DB
      .select("id", { count: "exact", head: true })
      .eq("status", "Need-Volunteer"); // ✅ make sure status matches DB case

    if (error) {
      console.error("Supabase Error:", error);
      return res.status(500).json({ error: "Error fetching active donations count" });
    }

    return res.json({ activeDonations: count }); // ✅ correct key name
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
