// models/Issue.js
const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: [
      "Roads",
      "Water Supply",
      "Electricity",
      "Sanitation",
      "Street Lights",
      "Drainage",
      "Parks",
      "Other",
    ],
  },
  image: {
    url: {
      type: String,
      default: null,
    },
    publicId: {
      type: String,
      default: null,
    },
  },
  location: {
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
    },
    address: {
      type: String,
      default: "Unknown Location",
    },
  },
  status: {
    type: String,
    enum: ["Pending", "In-Progress", "Resolved"],
    default: "Pending",
  },
  reportedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  adminNotes: {
    type: String,
    default: "",
  },
  statusHistory: [
    {
      status: {
        type: String,
        enum: ["Pending", "In-Progress", "Resolved"],
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
issueSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Initialize status history on creation
issueSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      updatedAt: Date.now(),
    });
  }
  next();
});

module.exports = mongoose.model("Issue", issueSchema);
