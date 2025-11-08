// routes/auth.js
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Try to load protect middleware (optional). If you have a middleware file, ensure it exports `protect`.
let protect;
try {
  ({ protect } = require("../middleware/auth")); // if exists, must export { protect }
} catch (err) {
  // fallback for local dev so routes still work without middleware
  protect = (req, res, next) => {
    // If you want req.user available for testing, uncomment and set a test user id:
    // req.user = { id: "PUT_TEST_USER_ID_HERE" };
    return next();
  };
}

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

// Protected route example
router.get("/me", protect, authController.getMe);

module.exports = router;
