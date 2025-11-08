// controllers/issueController.js
const Issue = require("../models/Issue");
const { deleteImage } = require("../config/cloudinary");

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    // Validate required fields
    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Parse location if it's a string
    const parsedLocation =
      typeof location === "string" ? JSON.parse(location) : location;

    // Validate location
    if (!parsedLocation.latitude || !parsedLocation.longitude) {
      return res.status(400).json({
        success: false,
        message: "Location coordinates are required",
      });
    }

    // Prepare issue data
    const issueData = {
      title,
      description,
      category,
      location: parsedLocation,
      reportedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    };

    // Add image info if uploaded
    if (req.file) {
      issueData.image = {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // Cloudinary public ID
      };
    }

    // Create issue
    const issue = await Issue.create(issueData);

    res.status(201).json({
      success: true,
      message: "Issue reported successfully",
      issue,
    });
  } catch (error) {
    // If image was uploaded but issue creation failed, delete the image
    if (req.file && req.file.filename) {
      await deleteImage(req.file.filename);
    }

    res.status(500).json({
      success: false,
      message: "Error creating issue",
      error: error.message,
    });
  }
};

// @desc    Get all issues for logged in user
// @route   GET /api/issues/my-issues
// @access  Private
exports.getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ "reportedBy.userId": req.user._id }).sort(
      { createdAt: -1 }
    );

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

// @desc    Get single issue by ID
// @route   GET /api/issues/:id
// @access  Private
exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Check if user owns this issue or is admin
    if (
      issue.reportedBy.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this issue",
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

// @desc    Track issue by ID (public)
// @route   GET /api/issues/track/:id
// @access  Public
exports.trackIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).select("-adminNotes");

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
      message: "Error tracking issue",
      error: error.message,
    });
  }
};

// @desc    Delete issue (User can delete their own issue)
// @route   DELETE /api/issues/:id
// @access  Private
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Check if user owns this issue
    if (issue.reportedBy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this issue",
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
