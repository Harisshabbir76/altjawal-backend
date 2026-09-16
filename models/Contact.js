const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Contact',
  new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true },
    phone:     { type: String },
    message:   { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  })
);
