const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";

    let query = {};

    if (search) {
      query = { username: { $regex: search, $options: "i" } };
    }

    const users = await User.find(query).select("-password");
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
