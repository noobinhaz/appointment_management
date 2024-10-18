const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth"); // Middleware to protect the route

const router = express.Router();

// Get users with optional search by username
router.get("/", auth, async (req, res) => {
  try {
    // Get the search query from the request query parameters (e.g., ?search=test)
    const search = req.query.search ? req.query.search.trim() : "";

    // Create a query object
    let query = {};

    // If search is provided, search for users with usernames that contain the search term
    if (search) {
      query = { username: { $regex: search, $options: "i" } }; // 'i' for case-insensitive search
    }

    // Find users based on the query
    const users = await User.find(query).select("-password"); // Exclude password from the result
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
