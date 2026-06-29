const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const Listing = require('../models/Listing');
const { protect, admin } = require('../middleware/auth');

// Every route in this file requires a logged-in admin.
router.use(protect, admin);

// Extract a Cloudinary public_id from a stored secure URL (needed for deletion)
const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes('/upload/')) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

// @desc    Site overview stats
// @route   GET /api/admin/stats
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const [totalListings, totalUsers, totalAdmins, negotiableCount, perWard] = await Promise.all([
      Listing.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Listing.countDocuments({ isNegotiable: true }),
      Listing.aggregate([
        { $group: { _id: '$ward', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalListings,
        totalUsers,
        totalAdmins,
        negotiableCount,
        perWard, // [{ _id: wardNumber, count }]
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get every listing (with owner info)
// @route   GET /api/admin/listings
// @access  Admin
router.get('/listings', async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { municipality: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } },
        { contactPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const listings = await Listing.find(query)
      .populate('owner', 'name email phone role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get every registered user (with their listing count)
// @route   GET /api/admin/users
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();

    // Attach a listing count to each user
    const counts = await Listing.aggregate([
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => {
      countMap[String(c._id)] = c.count;
    });

    const data = users.map((u) => ({
      ...u,
      listingCount: countMap[String(u._id)] || 0,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a user and all of their listings (with images)
// @route   DELETE /api/admin/users/:id
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent an admin from deleting their own account here
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove all of this user's listings + their Cloudinary images
    const listings = await Listing.find({ owner: user._id });
    for (const listing of listings) {
      if (listing.images && listing.images.length > 0) {
        listing.images.forEach((imgUrl) => {
          const publicId = getCloudinaryPublicId(imgUrl);
          if (publicId) {
            cloudinary.uploader.destroy(publicId).catch(() => {});
          }
        });
      }
    }
    await Listing.deleteMany({ owner: user._id });
    await user.deleteOne();

    res.json({ success: true, message: 'User and their listings removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
