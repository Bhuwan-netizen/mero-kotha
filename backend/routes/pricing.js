const express = require('express');
const router = express.Router();
const Pricing = require('../models/Pricing');
const { protect, admin } = require('../middleware/auth');

// @desc    Get current service pricing (shown in the public Pricing modal)
// @route   GET /api/pricing
// @access  Public
router.get('/', async (req, res) => {
  try {
    const pricing = await Pricing.getSingleton();
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update service pricing
// @route   PUT /api/pricing
// @access  Admin
router.put('/', protect, admin, async (req, res) => {
  try {
    const pricing = await Pricing.getSingleton();

    const numberFields = ['ownerWeekly', 'ownerBiWeekly', 'ownerMonthly', 'customerViewingPrice'];
    for (const field of numberFields) {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        const value = parseFloat(req.body[field]);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({ success: false, message: `Invalid value for ${field}` });
        }
        pricing[field] = value;
      } else if (req.body[field] === '') {
        pricing[field] = 0;
      }
    }

    const textFields = ['ownerOffer', 'customerOffer'];
    for (const field of textFields) {
      if (req.body[field] !== undefined) {
        pricing[field] = String(req.body[field]).trim();
      }
    }

    await pricing.save();
    res.json({ success: true, data: pricing, message: 'Pricing updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
