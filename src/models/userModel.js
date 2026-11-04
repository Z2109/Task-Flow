
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic information
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    // Profile information
    avatar: {
      type: String,
      default: "",
    },

    jobTitle: {
      type: String,
      default: "",
      trim: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    // Account role
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Password reset
    resetPasswordToken: {
      type: String,
      default: undefined,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: undefined,
      select: false,
    },

    // Preferences
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "light",
      },

      language: {
        type: String,
        default: "en",
      },

      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },

      dateFormat: {
        type: String,
        default: "DD MMM YYYY",
      },
    },

    // Notification preferences
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },

      taskUpdates: {
        type: Boolean,
        default: true,
      },

      projectUpdates: {
        type: Boolean,
        default: true,
      },

      teamUpdates: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const userModel =
  mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;
