const mongoose = require('mongoose');

module.exports = mongoose.model(
  'AdminPasswordOverride',
  new mongoose.Schema({
    hashedPassword: { type: String, required: true },
    updatedAt:      { type: Date, default: Date.now },
  })
);
