// config/db.js (MongoDB Connection)
// This file handles the connection to your MongoDB database using Mongoose.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI from environment variables
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...'); // Log success message
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`); // Log error message
    process.exit(1);
  }
};

module.exports = connectDB;
