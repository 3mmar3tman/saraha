
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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

    // Google account ID (Google users only)
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Optional because Google users don't need a password
    password: {
      type: String,
      required: false,
    },

    age: {
      type: Number,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    otpExpires: {
      type: Date,
    },
    profilePicture: {
      type: String,
      default: null,
},
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
