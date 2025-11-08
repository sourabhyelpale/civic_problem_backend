// scripts/seedAdmin.js
// Run this script to create an admin user
// Usage: node scripts/seedAdmin.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

// Load env vars
dotenv.config();

// Connect to database
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@civic.com" });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      console.log("Email: admin@civic.com");
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: "Admin User",
      email: "admin@civic.com",
      password: "admin123",
      role: "admin",
      phone: "1234567890",
    });

    console.log("✅ Admin user created successfully!");
    console.log("-----------------------------------");
    console.log("Email: admin@civic.com");
    console.log("Password: admin123");
    console.log("-----------------------------------");
    console.log("⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

seedAdmin();
