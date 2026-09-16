const mongoose = require('mongoose');

module.exports = mongoose.model(
  'OffDay',
  new mongoose.Schema({
    date:      { type: String, required: true, unique: true },
    fullDay:   { type: Boolean, default: true },
    startTime: { type: String, default: '' },
    endTime:   { type: String, default: '' },
  })
);
