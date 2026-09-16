const mongoose = require('mongoose');

module.exports = mongoose.model(
  'AdminOTP',
  new mongoose.Schema({
    otp:       { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  })
);
