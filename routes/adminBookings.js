const express = require('express');
const Booking = require('../models/Booking');

const router = express.Router();

function dayStart(dateStr) {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysAgoStart(n) {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - n));
}

function todayStart() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// GET /api/admin/bookings
router.get('/', async (req, res) => {
  try {
    const { quick, onDate, from, to } = req.query;

    const today   = todayStart();
    const tomorrow = new Date(today.getTime() + 86400000);

    let filter = {};

    if (quick === 'today') {
      filter.createdAt = { $gte: today, $lt: tomorrow };
    } else if (quick === 'yesterday') {
      const yesterday = daysAgoStart(1);
      filter.createdAt = { $gte: yesterday, $lt: today };
    } else if (quick === 'last3') {
      filter.createdAt = { $gte: daysAgoStart(3), $lt: tomorrow };
    } else if (quick === 'last7') {
      filter.createdAt = { $gte: daysAgoStart(7), $lt: tomorrow };
    } else if (onDate) {
      const start = dayStart(onDate);
      filter.createdAt = { $gte: start, $lt: new Date(start.getTime() + 86400000) };
    } else if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = dayStart(from);
      if (to)   filter.createdAt.$lt  = new Date(dayStart(to).getTime() + 86400000);
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.json({ bookings, total: bookings.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PATCH /api/admin/bookings/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const update = {};
    if (status !== undefined) update.status = status;
    if (notes  !== undefined) update.notes  = notes;

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/admin/bookings/:id
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
