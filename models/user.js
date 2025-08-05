// models/User.js (User Schema)
// This file defines the Mongoose schema for the User model, including password hashing.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For hashing passwords

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true, // Remove whitespace from both ends of a string
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true, // Convert email to lowercase before saving
    match: [/.+@.+\..+/, 'Please use a valid email address'], // Basic email validation
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  phoneForWithdrawal: {
    type: String,
    required: [true, 'Phone number for withdrawal is required'],
    unique: true, // Assuming phone numbers are unique for withdrawal purposes
    trim: true,
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  bonuses: {
    type: Number,
    default: 0,
  },
  totalReferrals: {
    type: Number,
    default: 0,
  },
  totalReferralBonuses: {
    type: Number,
    default: 0,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to hash password before saving the user
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    next();
  }

  // Generate a salt (random string)
  const salt = await bcrypt.genSalt(10); // 10 rounds is a good balance for security and performance
  // Hash the password using the generated salt
  this.password = await bcrypt.hash(this.password, salt);
  next(); // Proceed to save the user
});

// Method to compare entered password with hashed password in the database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('user', UserSchema); // <--- THIS LINE IS CRUCIAL
