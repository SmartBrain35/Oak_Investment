// server.js (Main Server File)
// This file sets up your Express application, connects to MongoDB, and imports routes.

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash'); // Corrected require for connect-flash
const cookieParser = require('cookie-parser'); // For parsing cookies
const jwt = require('jsonwebtoken'); // To decode JWT from cookie
const User = require('./models/User'); // Import the User model

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
// Specify the directory where your EJS template files are located
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(cookieParser()); // Use cookie-parser middleware

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey', // Use a strong secret from .env
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Connect flash for flash messages
app.use(flash());

// Middleware to make flash messages available to all templates
app.use((req, res, next) => {
  res.locals.messages = require('express-messages')(req, res); // This line makes 'messages' available
  res.locals.success_msg = req.flash('success_msg'); // Custom success message
  res.locals.error_msg = req.flash('error_msg');     // Custom error message
  res.locals.error = req.flash('error');             // General error message (used by Passport usually)
  next();
});

// Basic authentication middleware to extract user from JWT in cookie
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token; // Get token from cookie

  if (!token) {
    req.flash('error', 'Please log in to view this page.');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch the user from the database to get the latest data, not just token payload
    req.user = await User.findById(decoded.user.id).select('-password');
    if (!req.user) {
      res.clearCookie('token');
      req.flash('error', 'User not found. Please log in again.');
      return res.redirect('/login');
    }
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.clearCookie('token'); // Clear invalid token
    req.flash('error', 'Session expired or invalid. Please log in again.');
    res.redirect('/login');
  }
};

// Middleware to check if user is admin
const adminAuthMiddleware = (req, res, next) => {
  // req.user is populated by authMiddleware
  if (!req.user || !req.user.isAdmin) {
    req.flash('error', 'You are not authorized to view this page.');
    return res.redirect('/dashboard'); // Redirect non-admins to user dashboard
  }
  next();
};


// Define Routes
app.use('/api/auth', require('./routes/auth'));

// Routes for serving the EJS views
app.get('/login', (req, res) => {
  res.render('login', { messages: req.flash() });
});

app.get('/signup', (req, res) => {
  res.render('signup', { messages: req.flash() });
});

// User Dashboard Route (Protected)
app.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // req.user is already populated by authMiddleware
    res.render('dashboard', { user: req.user, messages: req.flash() });
  } catch (err) {
    console.error('Dashboard render error:', err.message);
    req.flash('error', 'Could not load dashboard data.');
    res.redirect('/login');
  }
});

// Admin Dashboard Route (Protected and Admin-only)
app.get('/adminDashboard', authMiddleware, adminAuthMiddleware, async (req, res) => {
  try {
    // req.user is already populated by authMiddleware
    res.render('adminDashboard', { user: req.user, messages: req.flash() });
  } catch (err) {
    console.error('Admin Dashboard render error:', err.message);
    req.flash('error', 'Could not load admin dashboard data.');
    res.redirect('/login');
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  res.clearCookie('token'); // Clear the JWT cookie
  req.flash('success', 'You have been logged out.');
  res.redirect('/login');
});


// A simple test route
app.get('/', (req, res) => {
  res.send('OAK Investment Backend API is running...');
});

// Define the port to listen on
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
