const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const createError = require("../utils/createError");
const { hashPassword, comparePassword } = require("../utils/password");
const validator = require("validator");
const bcrypt = require("bcrypt");
const emailjs = require('@emailjs/nodejs');

// Register a new user
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input fields
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (name.length > 50) {
      return res.status(400).json({ error: "Name cannot exceed 50 characters" });
    }
    const isNtnuEmail = email.endsWith("@stud.ntnu.no") || email.endsWith("@ntnu.no");
    if (!validator.isEmail(email) || !isNtnuEmail) {
      return res.status(400).json({ error: "Please use a valid NTNU email address." });
    }
    if (!validator.isStrongPassword(password, {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })) {
      return res.status(400).json({
        error: "Password must be stronger. At least 6 characters, including a number, a symbol, and mixed case letters.",
      });
    }

    // Check if user already exists
    const exist = await User.findOne({ email });
    if (exist) {
      return next(new createError("Email already exists", 400));
    }

    // Determine user role based on email domain
    const role = email.endsWith("@stud.ntnu.no") ? "student" : "teacher";

    // Hash the password and create new user
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Remove password from response
    const userForResponse = { ...newUser._doc };
    delete userForResponse.password;

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      user: userForResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !validator.isEmail(email) || !password) {
      return next(new createError("Invalid email or password", 400));
    }

    // Find user and check password
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await comparePassword(password, user.password))) {
      return next(new createError("Invalid email or password", 401));
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Set token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) * 24 * 60 * 60 * 1000),
    });

    // Prepare user object for response
    const userForResponse = { ...user.toObject() };
    delete userForResponse.password;

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      user: userForResponse,
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
const logoutUser = (req, res) => {
  // Clear the token cookie
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

// Update user details
const updateUser = async (req, res) => {
  const userId = req.user._id;
  const { name, password } = req.body;

  const updateData = { name }; // Initialize update data with name

  try {
    // Add photo if provided
    if (req.file) {
      updateData.photo = req.file.filename;
    }

    // Hash and add password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, select: "-password" });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ status: "success", user: updatedUser });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Failed to update user.", error: error.message });
  }
};

// Fetch all students
const fetchStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("name email photo");
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ error: "Failed to fetch students." });
  }
};

// Update student details
const updateStudentDetails = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  // Validate email and name
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  if (name && name.length > 50) {
    return res.status(400).json({ error: "Name cannot exceed 50 characters." });
  }

  try {
    // Check if email is taken by another user
    const emailExists = await User.findOne({ _id: { $ne: id }, email: email });
    if (emailExists) {
      return res.status(400).json({ error: "Email already in use by another account." });
    }

    // Update student details
    const updatedStudent = await User.findByIdAndUpdate(id, { name, email }, { new: true, select: "-password" });
    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found." });
    }

    res.json({ status: "success", user: updatedStudent });
  } catch (error) {
    console.error("Failed to update student:", error);
    res.status(500).json({ error: "Failed to update student details." });
  }
};

// Request a password reset code
const requestResetCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with that email.' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.RESET_PASSWORD_KEY,
      { expiresIn: '20m' }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/password-reset-with-token/${token}?email=${encodeURIComponent(email)}`;
    const templateParams = {
      to_email: email,
      reset_url: resetUrl
    };

    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Reset password after receiving the reset email
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_KEY);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: 'Invalid token or user not found.' });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password successfully updated.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password.' });
  }
};

// Verify password reset token
const verifyPasswordResetToken = (req, res) => {
  const { token } = req.params;
  try {
    jwt.verify(token, process.env.RESET_PASSWORD_KEY);
    res.status(200).json({ message: "Valid token" });
  } catch (error) {
    res.status(400).json({ error: "Invalid or expired token" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  fetchStudents,
  updateUser,
  updateStudentDetails,
  requestResetCode,
  verifyPasswordResetToken,
  resetPassword,
};
