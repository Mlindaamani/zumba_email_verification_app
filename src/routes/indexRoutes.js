const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/authMiddleware");
const { renderWithLayout } = require("../utils/viewHelper");
const User = require("../models/User");

// Home page
router.get("/", async (req, res) => {
  try {
    const html = await renderWithLayout(
      "home",
      {
        title: "Home",
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).send("Error rendering page");
  }
});

// Dashboard (protected route)
router.get("/dashboard", requireLogin, async (req, res) => {
  try {
    // Fetch user's recent activity logs
    const activities = await User.getActivityLogs(req.user.id, 10);

    const html = await renderWithLayout(
      "dashboard",
      {
        title: "Dashboard",
        activities: activities || [],
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).send("Error rendering page");
  }
});

module.exports = router;
