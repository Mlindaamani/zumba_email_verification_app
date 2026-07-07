const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/authMiddleware");
const { renderWithLayout } = require("../utils/viewHelper");

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
    const html = await renderWithLayout(
      "dashboard",
      {
        title: "Dashboard",
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
