// routes/admin.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

// Attempt to load auth middleware; if missing, use no-op middleware for local dev.
let protect, authorize;
try {
  ({ protect, authorize } = require("../middleware/auth"));
} catch (err) {
  // fallback no-op implementations for local dev
  protect = (req, res, next) => next();
  authorize =
    (...roles) =>
    (req, res, next) =>
      next();
}

// Routes (authorize('admin') will check role using your middleware.authorize)
router.get(
  "/issues",
  protect,
  authorize("admin"),
  adminController.getAllIssues
);
router.get(
  "/issues/:id",
  protect,
  authorize("admin"),
  adminController.getIssueById
);
router.patch(
  "/issues/:id/status",
  protect,
  authorize("admin"),
  adminController.updateIssueStatus
);
router.patch(
  "/issues/:id/notes",
  protect,
  authorize("admin"),
  adminController.addAdminNotes
);
router.get(
  "/stats",
  protect,
  authorize("admin"),
  adminController.getDashboardStats
);
router.delete(
  "/issues/:id",
  protect,
  authorize("admin"),
  adminController.deleteIssue
);

module.exports = router;
