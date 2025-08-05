// routes/auth.js (Authentication Routes)
// This file defines the API endpoints for user authentication (signup and login).

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');


router.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword, phoneForWithdrawal } = req.body;

  // Basic server-side validation
  if (!username || !email || !password || !confirmPassword || !phoneForWithdrawal) {
    req.flash('error', 'Please fill in all fields.');
    return res.redirect('/signup');
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/signup');
  }
  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters long.');
    return res.redirect('/signup');
  }

  try {
    // Check if user already exists by email, username, or phone
    let user = await User.findOne({ email });
    if (user) {
      req.flash('error', 'User with that email already exists.');
      return res.redirect('/signup');
    }
    user = await User.findOne({ username });
    if (user) {
      req.flash('error', 'User with that username already exists.');
      return res.redirect('/signup');
    }
    user = await User.findOne({ phoneForWithdrawal });
    if (user) {
        req.flash('error', 'User with that phone number already exists.');
        return res.redirect('/signup');
    }

    // Create a new user instance
    user = new User({
      username,
      email,
      password, // Password will be hashed by the pre-save middleware in User model
      phoneForWithdrawal,
    });

    // Save the user to the database
    await user.save();

    req.flash('success', 'Sign up successful! Please log in.');
    res.redirect('/login'); // Redirect to login page after successful signup

  } catch (error) {
    console.error('Signup error:', error.message);
    req.flash('error', 'An error occurred during sign up. Please try again.');
    res.redirect('/signup');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic server-side validation
  if (!email || !password) {
    req.flash('error', 'Please fill in all fields.');
    return res.redirect('/login');
  }

  try {
    // Check if user exists by email
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid Credentials.');
      return res.redirect('/login');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid Credentials.');
      return res.redirect('/login');
    }

    // Example with JWT (you'd send this as a cookie or in a redirect URL param)
    const payload = {
      user: {
        id: user.id,
        isAdmin: user.isAdmin,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        // Set the token as an HttpOnly cookie
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        req.flash('success', 'Login successful!');

        // Role-based redirection
        if (user.isAdmin) {
          res.redirect('/adminDashboard'); // Redirect to admin dashboard
        } else {
          res.redirect('/dashboard'); // Redirect to regular user dashboard
        }
      }
    );

  } catch (error) {
    console.error('Login error:', error.message);
    req.flash('error', 'An error occurred during login. Please try again.');
    res.redirect('/login');
  }
});

module.exports = router;
