const express = require('express');
const PageContentBlock = require('../models/PageContentBlock');

const router = express.Router();

// GET /api/cms/:pageSlug
router.get('/:pageSlug', async (req, res) => {
  try {
    const blocks = await PageContentBlock.find({ pageSlug: req.params.pageSlug });
    res.json({ blocks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
