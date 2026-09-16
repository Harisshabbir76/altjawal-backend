const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Booking',
  new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true },
    phone:     { type: String },
    service:   { type: String, required: true },
    date:      { type: String, required: true },
    time:      { type: String, required: true },
    message:   { type: String, default: '' },
    status:    { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    notes:     { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  })
);
