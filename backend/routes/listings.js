const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Listing = require('../models/Listing');
const { protect } = require('../middleware/auth');

// Store uploaded images on Cloudinary (persistent CDN) instead of local disk.
// Local disk on hosts like Render is wiped on every restart/redeploy.
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mero-kotha',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
  },
});

// Extract a Cloudinary public_id from a stored secure URL (needed for deletion)
const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes('/upload/')) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG, WEBP) are allowed'), false);
  }
};

// Initialize multer with 2 files limit and max 5MB size
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
}).array('images', 2); // 'images' is the key name, max 2 images

// Wrap upload in custom handler to catch errors and return clean responses
const handleUpload = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer specific error (like file too large, too many files)
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: 'You can upload up to 2 images only' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      // General error
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// @desc    Create a listing
// @route   POST /api/listings
// @access  Private (Owners only)
router.post('/', protect, handleUpload, async (req, res) => {
  try {
    const { title, description, ward, location, price, contactName, contactPhone, isNegotiable } = req.body;

    // Ward validation (1 to 10)
    const wardNum = parseInt(ward);
    if (isNaN(wardNum) || wardNum < 1 || wardNum > 10) {
      return res.status(400).json({ success: false, message: 'Ward number must be between 1 and 10' });
    }

    const isNegotiableBool = isNegotiable === 'true' || isNegotiable === true;
    const parsedPrice = isNegotiableBool && (!price || parseFloat(price) === 0) ? 0 : parseFloat(price);

    // Cloudinary returns the hosted image URL as file.path
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        imagePaths.push(file.path);
      });
    }

    const listing = await Listing.create({
      owner: req.user._id,
      title,
      description,
      ward: wardNum,
      location,
      price: parsedPrice,
      isNegotiable: isNegotiableBool,
      images: imagePaths,
      contactName: contactName || req.user.name,
      contactPhone: contactPhone || req.user.phone,
    });

    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    // Remove uploaded images from Cloudinary if creation failed
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.filename) cloudinary.uploader.destroy(file.filename).catch(() => {});
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all listings (with search, filter by ward, price ranges)
// @route   GET /api/listings
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { ward, minPrice, maxPrice, search } = req.query;
    const query = {};

    // Filter by Ward
    if (ward) {
      const wardNum = parseInt(ward);
      if (!isNaN(wardNum) && wardNum >= 1 && wardNum <= 10) {
        query.ward = wardNum;
      }
    }

    // Filter by Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by text search (title/location/description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Get listings sorted by newest first
    const listings = await Listing.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user's listings (for Dashboard)
// @route   GET /api/listings/my
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: listings.length, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single listing details
// @route   GET /api/listings/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('owner', 'name email phone');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Verify ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this listing' });
    }

    // Delete associated images from Cloudinary
    if (listing.images && listing.images.length > 0) {
      listing.images.forEach((imgUrl) => {
        const publicId = getCloudinaryPublicId(imgUrl);
        if (publicId) {
          cloudinary.uploader.destroy(publicId).catch((err) => {
            console.error(`Failed to delete Cloudinary image: ${publicId}`, err);
          });
        }
      });
    }

    await listing.deleteOne();

    res.json({ success: true, message: 'Listing removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private (Owner only)
router.put('/:id', protect, handleUpload, async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Verify ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this listing' });
    }

    const { title, description, ward, location, price, contactName, contactPhone, isNegotiable } = req.body;

    // Parse fields
    if (ward) {
      const wardNum = parseInt(ward);
      if (isNaN(wardNum) || wardNum < 1 || wardNum > 10) {
        return res.status(400).json({ success: false, message: 'Ward number must be between 1 and 10' });
      }
      listing.ward = wardNum;
    }

    if (isNegotiable !== undefined) {
      listing.isNegotiable = isNegotiable === 'true' || isNegotiable === true;
    }

    if (price !== undefined) {
      listing.price = (isNegotiable === 'true' || isNegotiable === true) && (!price || parseFloat(price) === 0) ? 0 : parseFloat(price);
    }

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (location) listing.location = location;
    if (contactName) listing.contactName = contactName;
    if (contactPhone) listing.contactPhone = contactPhone;

    // Handle images update if new files are uploaded
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      if (listing.images && listing.images.length > 0) {
        listing.images.forEach((imgUrl) => {
          const publicId = getCloudinaryPublicId(imgUrl);
          if (publicId) {
            cloudinary.uploader.destroy(publicId).catch((err) => {
              console.error(`Failed to delete old Cloudinary image: ${publicId}`, err);
            });
          }
        });
      }

      // Save new Cloudinary URLs
      const imagePaths = [];
      req.files.forEach((file) => {
        imagePaths.push(file.path);
      });
      listing.images = imagePaths;
    }

    await listing.save();

    res.json({ success: true, data: listing });
  } catch (error) {
    // Remove newly uploaded images from Cloudinary if update failed
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (file.filename) cloudinary.uploader.destroy(file.filename).catch(() => {});
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
