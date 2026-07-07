const passport = require("passport");
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
 * Show registration page
 */
const getRegister = async (req, res) => {
  try {
    const html = await renderWithLayout(
      "register",
      {
        title: "Register",
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
 * Handle registration submission
 */
const postRegister = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    const html = await renderWithLayout(
      "register",
      {
        title: "Register",
        error: "Please fill all fields.",
      },
      req,
    );
    return res.send(html);
  }

  if (!isValidEmail(email)) {
    const html = await renderWithLayout(
      "register",
      {
        title: "Register",
        error: "Email is not valid. Use a real email address.",
      },
      req,
    );
    return res.send(html);
  }

  try {
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      const html = await renderWithLayout(
        "register",
        {
          title: "Register",
          error: "Email already registered. Please login or use another email.",
        },
        req,
      );
      return res.send(html);
    }

    // Create user
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const verifyToken = generateToken();

    const result = await User.create({
      name,
      email,
      passwordHash,
      salt,
      verifyToken,
    });

    // Log account creation activity
    const userId = result.insertId;
    try {
      await User.logActivity(userId, "Account created", req.ip);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }

    // Send verification email
    const verifyUrl = `${req.protocol}://${req.get("host")}/verify?token=${verifyToken}`;

    // Render email template
    const emailTemplatePath = path.join(
      __dirname,
      "../views/emails/verification.ejs",
    );
    const emailHtml = await ejs.renderFile(emailTemplatePath, {
      name,
      verifyUrl,
    });

    await mailTransport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email - Email Verification App",
      html: emailHtml,
    });

    const html = await renderWithLayout(
      "message",
      {
        title: "Registration Successful",
        type: "success",
        message: "Verification email sent to",
        email: email,
        link: { url: "/login", text: "Go to Login" },
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Register error:", error);
    const html = await renderWithLayout(
      "message",
      {
        title: "Registration Failed",
        type: "error",
        message: "Failed to register. Please try again later.",
        link: { url: "/register", text: "Try Again" },
      },
      req,
    );
    res.send(html);
  }
};

/**
 * Handle email verification
 */
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    const html = await renderWithLayout(
      "message",
      {
        title: "Invalid Link",
        type: "error",
        message: "Invalid verification link.",
        link: null,
      },
      req,
    );
    return res.send(html);
  }

  try {
    const user = await User.findByVerifyToken(token);

    if (!user) {
      const html = await renderWithLayout(
        "message",
        {
          title: "Verification Failed",
          type: "error",
          message: "Email not verified. Token is invalid or expired.",
          link: null,
        },
        req,
      );
      return res.send(html);
    }

    await User.markAsVerified(user.id);

    // Log email verification activity
    try {
      await User.logActivity(user.id, "Email verified", req.ip);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }

    const html = await renderWithLayout(
      "message",
      {
        title: "Email Verified",
        type: "success",
        message: "Your email has been successfully verified!",
        email: user.email,
        link: { url: "/login", text: "Login Now" },
      },
      req,
    );
    res.send(html);
  } catch (error) {
    console.error("Verify error:", error);
    const html = await renderWithLayout(
      "message",
      {
        title: "Verification Error",
        type: "error",
        message: "Failed to verify email. Please try again later.",
        link: null,
      },
      req,
    );
    res.send(html);
  }
};

/**
 * Show login page
 */
const getLogin = async (req, res) => {
  try {
    const html = await renderWithLayout(
      "login",
      {
        title: "Login",
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
 * Handle login submission
 */
const postLogin = (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      const html = await renderWithLayout(
        "login",
        {
          title: "Login",
          error: info && info.message ? info.message : "Login failed.",
        },
        req,
      );
      return res.send(html);
    }
    req.logIn(user, async (loginError) => {
      if (loginError) {
        return next(loginError);
      }
      
      // Log the login activity
      try {
        await User.logActivity(user.id, "Logged in", req.ip);
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
      
      return res.redirect("/dashboard");
    });
  })(req, res, next);
};

/**
 * Handle logout
 */
const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
};

module.exports = {
  getRegister,
  postRegister,
  verifyEmail,
  getLogin,
  postLogin,
  logout,
};
