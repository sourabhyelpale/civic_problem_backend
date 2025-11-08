// routes/issues.js
const express = require("express");
const router = express.Router();
const {
  createIssue,
  getMyIssues,
  getIssueById,
  trackIssue,
  deleteIssue,
} = require("../controllers/issueController");
const { protect } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

// Protected routes (require authentication)
// upload.single('image') handles image upload to Cloudinary
router.post("/", protect, upload.single("image"), createIssue);
router.get("/my-issues", protect, getMyIssues);
router.get("/:id", protect, getIssueById);
router.delete("/:id", protect, deleteIssue);

// Public route for tracking
router.get("/track/:id", trackIssue);

module.exports = router;
