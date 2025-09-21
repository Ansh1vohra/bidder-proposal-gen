const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../src/models/User');

async function resetUserPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'harshitsharma182021@gmail.com'; // Change this to your email
    const newPassword = 'password123'; // Change this to your desired password

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    const result = await User.updateOne(
      { email: email.toLowerCase() },
      { 
        password: hashedPassword,
        loginAttempts: 0,
        lockUntil: undefined
      }
    );

    if (result.matchedCount === 0) {
      console.log('User not found with email:', email);
    } else if (result.modifiedCount === 0) {
      console.log('User found but password was not updated');
    } else {
      console.log('Password successfully updated for:', email);
      console.log('New password:', newPassword);
    }

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

resetUserPassword();
