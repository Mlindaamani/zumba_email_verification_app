const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/authMiddleware");
const profileController = require("../controllers/profileController");

// Password Reset (Public)
router.get("/forgot-password", profileController.getForgotPassword);
router.post("/forgot-password", profileController.postForgotPassword);
router.get("/reset-password", profileController.getResetPassword);
router.post("/reset-password", profileController.postResetPassword);

// Change Password (Protected)
router.get(
  "/change-password",
  requireLogin,
  profileController.getChangePassword,
);
router.post(
  "/change-password",
  requireLogin,
  profileController.postChangePassword,
);

// Edit Profile (Protected)
router.get("/edit-profile", requireLogin, profileController.getEditProfile);
router.post("/edit-profile", requireLogin, profileController.postEditProfile);

module.exports = router;
