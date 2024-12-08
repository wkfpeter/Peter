const express = require("express");
const router = express.Router();
const Location = require("../models/location");
const { authenticate, authorize } = require("../middleware/auth");

// Public route
router.get("/", async (req, res) => {
  try {
    const locations = await Location.find();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
