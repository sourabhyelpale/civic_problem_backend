// controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: "7d",
  });
};

// POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // User model has pre-save password hashing; pass raw password.
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "citizen",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("registerUser err:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing email or password" });

    // password is select:false in the model — explicitly select it
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user._id);
    const userSafe = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Logged in",
      user: userSafe,
      token,
    });
  } catch (err) {
    console.error("loginUser err:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("getMe err:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
