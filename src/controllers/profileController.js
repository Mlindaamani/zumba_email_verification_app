const path = require("path");
const ejs = require("ejs");
const {
  generateSalt,
  hashPassword,
  generateToken,
} = require("../utils/crypto");
const { isValidEmail } = require("../utils/validators");
const { renderWithLayout } = require("../utils/viewHelper");
const User = require("../models/User");
const mailTransport = require("../config/email");

/**
 * Show forgot password page
 */
const getForgotPassword = async (req, res) => {
  try {
    const html = await renderWithLayout(
      "forgot-password",
      {
        title: "Forgot Password",
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).send("Error rendering page");
  }
};

/**
 * Handle forgot password submission
 */
const postForgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    const html = await renderWithLayout(
      "forgot-password",
      {
        title: "Forgot Password",
        error: "Please provide a valid email address.",
      },
      req,
    );
    return res.send(html);
  }

  try {
    const user = await User.findByEmail(email);

    // Always show success message (security best practice)
    const html = await renderWithLayout(
      "message",
      {
        title: "Check Your Email",
        type: "success",
        message:
          "If an account exists with this email, you will receive password reset instructions.",
        link: { url: "/login", text: "Back to Login" },
      },
      req,
    );

    if (user) {
      // Generate reset token
      const resetToken = generateToken();
      await User.createResetToken(user.id, resetToken);

      // Send reset email
      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${resetToken}`;
      const emailTemplatePath = path.join(
        __dirname,
        "../views/emails/reset-password.ejs",
      );
      const emailHtml = await ejs.renderFile(emailTemplatePath, {
        name: user.name,
        resetUrl,
      });

      await mailTransport.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Your Password - Email Verification App",
        html: emailHtml,
      });

      // Log activity
      await User.logActivity(user.id, "Password reset requested", req.ip);
    }

    res.send(html);
  } catch (error) {
    console.error("Forgot password error:", error);
    const html = await renderWithLayout(
      "message",
      {
        title: "Error",
        type: "error",
        message: "An error occurred. Please try again later.",
        link: { url: "/forgot-password", text: "Try Again" },
      },
      req,
    );
    res.send(html);
  }
};

/**
 * Show reset password page
 */
const getResetPassword = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    const html = await renderWithLayout(
      "message",
      {
        title: "Invalid Link",
        type: "error",
        message: "Invalid or missing reset token.",
        link: { url: "/forgot-password", text: "Request New Link" },
      },
      req,
    );
    return res.send(html);
  }

  try {
    const user = await User.findByResetToken(token);

    if (!user) {
      const html = await renderWithLayout(
        "message",
        {
          title: "Invalid or Expired Link",
          type: "error",
          message:
            "This reset link is invalid or has expired. Please request a new one.",
          link: { url: "/forgot-password", text: "Request New Link" },
        },
        req,
      );
      return res.send(html);
    }

    const html = await renderWithLayout(
      "reset-password",
      {
        title: "Reset Password",
        token,
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Reset password page error:", error);
    res.status(500).send("Error rendering page");
  }
};

/**
 * Handle reset password submission
 */
const postResetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    const html = await renderWithLayout(
      "reset-password",
      {
        title: "Reset Password",
        token,
        error: "All fields are required.",
      },
      req,
    );
    return res.send(html);
  }

  if (password.length < 6) {
    const html = await renderWithLayout(
      "reset-password",
      {
        title: "Reset Password",
        token,
        error: "Password must be at least 6 characters.",
      },
      req,
    );
    return res.send(html);
  }

  if (password !== confirmPassword) {
    const html = await renderWithLayout(
      "reset-password",
      {
        title: "Reset Password",
        token,
        error: "Passwords do not match.",
      },
      req,
    );
    return res.send(html);
  }

  try {
    const user = await User.findByResetToken(token);

    if (!user) {
      const html = await renderWithLayout(
        "message",
        {
          title: "Invalid or Expired Link",
          type: "error",
          message: "This reset link is invalid or has expired.",
          link: { url: "/forgot-password", text: "Request New Link" },
        },
        req,
      );
      return res.send(html);
    }

    // Update password
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    await User.updatePassword(user.id, passwordHash, salt);

    // Log activity
    await User.logActivity(user.id, "Password changed", req.ip);

    const html = await renderWithLayout(
      "message",
      {
        title: "Password Reset Successful",
        type: "success",
        message:
          "Your password has been reset successfully. You can now login with your new password.",
        link: { url: "/login", text: "Login Now" },
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Reset password error:", error);
    const html = await renderWithLayout(
      "message",
      {
        title: "Error",
        type: "error",
        message: "An error occurred. Please try again later.",
        link: { url: "/forgot-password", text: "Try Again" },
      },
      req,
    );
    res.send(html);
  }
};

/**
 * Show change password page
 */
const getChangePassword = async (req, res) => {
  try {
    const html = await renderWithLayout(
      "change-password",
      {
        title: "Change Password",
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).send("Error rendering page");
  }
};

/**
 * Handle change password submission
 */
const postChangePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    const html = await renderWithLayout(
      "change-password",
      {
        title: "Change Password",
        error: "All fields are required.",
      },
      req,
    );
    return res.send(html);
  }

  if (newPassword.length < 6) {
    const html = await renderWithLayout(
      "change-password",
      {
        title: "Change Password",
        error: "New password must be at least 6 characters.",
      },
      req,
    );
    return res.send(html);
  }

  if (newPassword !== confirmPassword) {
    const html = await renderWithLayout(
      "change-password",
      {
        title: "Change Password",
        error: "New passwords do not match.",
      },
      req,
    );
    return res.send(html);
  }

  try {
    const user = await User.findById(req.user.id);
    const currentPasswordHash = hashPassword(
      currentPassword,
      user.password_salt,
    );

    if (currentPasswordHash !== user.password_hash) {
      const html = await renderWithLayout(
        "change-password",
        {
          title: "Change Password",
          error: "Current password is incorrect.",
        },
        req,
      );
      return res.send(html);
    }

    // Update password
    const salt = generateSalt();
    const passwordHash = hashPassword(newPassword, salt);
    await User.updatePassword(user.id, passwordHash, salt);

    // Log activity
    await User.logActivity(user.id, "Password changed", req.ip);

    const html = await renderWithLayout(
      "message",
      {
        title: "Password Changed",
        type: "success",
        message: "Your password has been changed successfully.",
        link: { url: "/dashboard", text: "Go to Dashboard" },
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Change password error:", error);
    const html = await renderWithLayout(
      "message",
      {
        title: "Error",
        type: "error",
        message: "An error occurred. Please try again later.",
        link: { url: "/change-password", text: "Try Again" },
      },
      req,
    );
    res.send(html);
  }
};

/**
 * Show edit profile page
 */
const getEditProfile = async (req, res) => {
  try {
    const html = await renderWithLayout(
      "edit-profile",
      {
        title: "Edit Profile",
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).send("Error rendering page");
  }
};

/**
 * Handle edit profile submission
 */
const postEditProfile = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    const html = await renderWithLayout(
      "edit-profile",
      {
        title: "Edit Profile",
        error: "Name is required.",
      },
      req,
    );
    return res.send(html);
  }

  try {
    await User.updateProfile(req.user.id, name.trim());

    // Update session user
    req.user.name = name.trim();

    // Log activity
    await User.logActivity(req.user.id, "Profile updated", req.ip);

    const html = await renderWithLayout(
      "message",
      {
        title: "Profile Updated",
        type: "success",
        message: "Your profile has been updated successfully.",
        link: { url: "/dashboard", text: "Go to Dashboard" },
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Edit profile error:", error);
    const html = await renderWithLayout(
      "message",
      {
        title: "Error",
        type: "error",
        message: "An error occurred. Please try again later.",
        link: { url: "/edit-profile", text: "Try Again" },
      },
      req,
    );
    res.send(html);
  }
};

module.exports = {
  getForgotPassword,
  postForgotPassword,
  getResetPassword,
  postResetPassword,
  getChangePassword,
  postChangePassword,
  getEditProfile,
  postEditProfile,
};
