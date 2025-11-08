// controllers/adminController.js
const Issue = require("../models/Issue");
const { deleteImage } = require("../config/cloudinary");

// @desc    Get all issues with filters
// @route   GET /api/admin/issues
// @access  Private/Admin
exports.getAllIssues = async (req, res) => {
  try {
    const { status, category, search, startDate, endDate } = req.query;

    // Build filter object
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .populate("reportedBy.userId", "name email");

    res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching issues",
      error: error.message,
    });
  }
};

// @desc    Get issue by ID (Admin view)
// @route   GET /api/admin/issues/:id
// @access  Private/Admin
exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("reportedBy.userId", "name email phone")
      .populate("statusHistory.updatedBy", "name email");

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      issue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching issue",
      error: error.message,
    });
  }
};

// @desc    Update issue status
// @route   PATCH /api/admin/issues/:id/status
// @access  Private/Admin
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["Pending", "In-Progress", "Resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Update status
    issue.status = status;

    // Add to status history
    issue.statusHistory.push({
      status,
      updatedAt: Date.now(),
      updatedBy: req.user._id,
    });

    await issue.save();

    res.status(200).json({
      success: true,
      message: "Issue status updated successfully",
      issue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating issue status",
      error: error.message,
    });
  }
};

// @desc    Add admin notes to issue
// @route   PATCH /api/admin/issues/:id/notes
// @access  Private/Admin
exports.addAdminNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({
        success: false,
        message: "Notes are required",
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    issue.adminNotes = notes;
    await issue.save();

    res.status(200).json({
      success: true,
      message: "Admin notes added successfully",
      issue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding admin notes",
      error: error.message,
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const pendingIssues = await Issue.countDocuments({ status: "Pending" });
    const inProgressIssues = await Issue.countDocuments({
      status: "In-Progress",
    });
    const resolvedIssues = await Issue.countDocuments({ status: "Resolved" });

    // Get category-wise breakdown
    const categoryStats = await Issue.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent issues (last 10)
    const recentIssues = await Issue.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title category status createdAt reportedBy");

    res.status(200).json({
      success: true,
      stats: {
        total: totalIssues,
        pending: pendingIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
        categoryBreakdown: categoryStats,
        recentIssues,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

// @desc    Delete issue (Admin only)
// @route   DELETE /api/admin/issues/:id
// @access  Private/Admin
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Delete image from Cloudinary if exists
    if (issue.image && issue.image.publicId) {
      await deleteImage(issue.image.publicId);
    }

    await issue.deleteOne();

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting issue",
      error: error.message,
    });
  }
};
