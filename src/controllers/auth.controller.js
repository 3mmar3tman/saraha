
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const googleClient = require("../config/google.config");
const jwt = require("jsonwebtoken");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate data
    if (!name || !email || !password) {
      return next(
        new AppError("All fields are required", 400)
      );
    }

    // 2. Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(
        new AppError("Email already exists", 409)
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // 5. Set OTP expiration (10 minutes)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // 6. Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires,
      isVerified: false,
    });

    // 7. Send response
    return res.status(201).json({
      success: true,
      message: "Registration successful. Verify your email.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate data
    if (!email || !password) {
      return next(
        new AppError("Email and password are required", 400)
      );
    }

    // 2. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return next(
        new AppError("Invalid email or password", 401)
      );
    }

    // 3. Compare password
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return next(
        new AppError("Invalid email or password", 401)
      );
    }

    // 4. Check email verification
    if (!user.isVerified) {
      return next(
        new AppError("Please verify your email first", 403)
      );
    }
   
    // 5. Success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    return next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    // 1. Get Google ID Token from request
    const { idToken } = req.body;

    if (!idToken) {
      return next(
        new AppError("Google ID Token is required", 400)
      );
    }

    // 2. Verify Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      sub: googleId,
      name,
      email,
      email_verified,
    } = payload;

    // 3. Check Google email verification
    if (!email || !email_verified) {
      return next(
        new AppError("Google email is not verified", 401)
      );
    }

    // 4. Check if Google account already exists
    let user = await User.findOne({ googleId });

    // 5. If user doesn't exist, search by email
    if (!user) {
      user = await User.findOne({
        email: email.toLowerCase(),
      });

      if (user) {
        // Link the verified Google account
        if (user.googleId && user.googleId !== googleId) {
          return next(
            new AppError("This email is linked to another Google account", 409)
          );
        }

        user.googleId = googleId;
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();
      } else {
        // 6. Create a new Google user
        user = await User.create({
          name,
          email: email.toLowerCase(),
          googleId,
          isVerified: true,
        });
      }
    }

    // 7. Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    // 8. Send response
    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    return next(error);
  }
};


const uploadProfilePicture = async (req, res, next) => {
  try {
    // 1. Check uploaded file
    if (!req.file) {
      return res.status(400).json({
        message: "Profile picture is required",
      });
    }

    // 2. Get image path
    const imagePath = `/uploads/profile/${req.file.filename}`;

    // 3. Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePicture: imagePath,
      },
      {
        new: true,
      }
    ).select("-password");

    // 4. Return response
    res.status(200).json({
      message: "Profile picture uploaded successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, age } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name !== undefined && { name }),
        ...(age !== undefined && { age }),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -otp -otpExpires");

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  uploadProfilePicture,
  updateProfile,

};

