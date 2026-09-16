const express = require('express');
const OffDay  = require('../models/OffDay');

const router = express.Router();

function toMins(t) {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return h * 60 + (m || 0);
}

// GET /api/admin/off-days
router.get('/', async (req, res) => {
  try {
    res.json(await OffDay.find().sort({ date: 1 }));
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/off-days  — upsert by date
router.post('/', async (req, res) => {
  const { date, fullDay, startTime, endTime } = req.body;
  if (!date) return res.status(400).json({ error: 'date is required.' });

  if (!fullDay && startTime && endTime) {
    if (toMins(startTime) >= toMins(endTime)) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }
  }

  try {
    const item = await OffDay.findOneAndUpdate(
      { date },
      {
        date,
        fullDay:   !!fullDay,
        startTime: fullDay ? '' : (startTime || ''),
        endTime:   fullDay ? '' : (endTime   || ''),
      },
      { upsert: true, new: true }
    );
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

// DELETE /api/admin/off-days/:id
router.delete('/:id', async (req, res) => {
  try {
    await OffDay.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
