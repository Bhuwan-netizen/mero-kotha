const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  isValidWard,
  isActiveMunicipality,
  buildMunicipalityMatcher,
  PROPERTY_TYPES,
  FURNISHING_OPTIONS,
  TENANT_OPTIONS,
  AMENITIES,
} = require('../config/jhapa');

// All customer <-> owner contact goes through the site admin. Every listing's
// contact phone is forced to this number regardless of what the owner submits.
const BROKER_PHONE = '9815910188';

// Normalize the amenities payload (sent as JSON string or array) to a clean
// list limited to known amenity values.
const parseAmenities = (raw) => {
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : raw.split(',');
    } catch {
      arr = raw.split(',');
    }
  }
  return arr.map((a) => String(a).trim()).filter((a) => AMENITIES.includes(a));
};

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
    const {
      title, description, municipality, ward, location, price,
      contactName, isNegotiable,
      propertyType, furnishing, bedrooms, bathrooms, amenities, preferredTenant,
    } = req.body;

    // Municipality + ward validation (ward range depends on the municipality).
    // New listings may only be created in the offered municipalities - rural
    // municipalities are no longer accepted.
    const wardNum = parseInt(ward);
    if (!municipality || !isActiveMunicipality(municipality) || !isValidWard(municipality, wardNum)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid municipality and ward number',
      });
    }

    // Property type must be one of the allowed values
    const type = PROPERTY_TYPES.includes(propertyType) ? propertyType : 'Room';

    const isNegotiableBool = isNegotiable === 'true' || isNegotiable === true;
    const parsedPrice = isNegotiableBool && (!price || parseFloat(price) === 0) ? 0 : parseFloat(price);

    // At least one property photo is required
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one property photo' });
    }

    // Cloudinary returns the hosted image URL as file.path
    const imagePaths = [];
    req.files.forEach((file) => {
      imagePaths.push(file.path);
    });

    const listing = await Listing.create({
      owner: req.user._id,
      title,
      description,
      municipality,
      ward: wardNum,
      location,
      propertyType: type,
      furnishing: FURNISHING_OPTIONS.includes(furnishing) ? furnishing : '',
      bedrooms: bedrooms ? Math.max(0, parseInt(bedrooms)) || 0 : 0,
      bathrooms: bathrooms ? Math.max(0, parseInt(bathrooms)) || 0 : 0,
      amenities: parseAmenities(amenities),
      preferredTenant: TENANT_OPTIONS.includes(preferredTenant) ? preferredTenant : 'Any',
      price: parsedPrice,
      isNegotiable: isNegotiableBool,
      images: imagePaths,
      contactName: contactName || req.user.name,
      // Locked: all inquiries go through the admin's phone.
      contactPhone: BROKER_PHONE,
    });

    res.status(201).json({
      success: true,
      data: listing,
      message: 'Your listing has been submitted for verification. It will appear publicly once an admin approves it.',
    });
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
    const {
      municipality, ward, minPrice, maxPrice, search,
      propertyType, furnishing, preferredTenant, amenities,
      page, limit,
    } = req.query;
    const query = {};

    // The public feed only ever shows admin-approved listings.
    query.status = 'approved';

    // Filter by Municipality.
    // Use a tolerant matcher so listings stored with a slightly different
    // municipality string (different casing, a missing "Municipality" suffix,
    // or the older "Birtamode" spelling) are still returned. Exact-string
    // matching previously hid such listings when a municipality was selected.
    if (municipality) {
      query.municipality = buildMunicipalityMatcher(municipality);
    }

    // Filter by Ward (allow up to 15 now)
    if (ward) {
      const wardNum = parseInt(ward);
      if (!isNaN(wardNum) && wardNum >= 1 && wardNum <= 15) {
        query.ward = wardNum;
      }
    }

    // Filter by property type
    if (propertyType && PROPERTY_TYPES.includes(propertyType)) {
      query.propertyType = propertyType;
    }

    // Filter by furnishing status
    if (furnishing && FURNISHING_OPTIONS.includes(furnishing)) {
      query.furnishing = furnishing;
    }

    // Filter by preferred tenant
    if (preferredTenant && TENANT_OPTIONS.includes(preferredTenant)) {
      query.preferredTenant = preferredTenant;
    }

    // Filter by amenities (comma-separated). Listing must have ALL requested.
    if (amenities) {
      const wanted = String(amenities)
        .split(',')
        .map((a) => a.trim())
        .filter((a) => AMENITIES.includes(a));
      if (wanted.length > 0) {
        query.amenities = { $all: wanted };
      }
    }

    // Filter by Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by text search (title/location/description/municipality)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { municipality: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination (20 per page by default)
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Boosted ("Featured") listings are pinned to the top of every page of
    // every filter/search combination, site-wide - they intentionally
    // ignore whatever filters were requested. They're fetched separately
    // (not part of `query`) and excluded from the normal filtered query
    // below so the same listing never shows up twice on one page.
    const boostedQuery = { status: 'approved', isBoosted: true };
    const normalQuery = { ...query, isBoosted: { $ne: true } };

    const [boostedListings, listings, totalCount] = await Promise.all([
      Listing.find(boostedQuery)
        .populate('owner', 'name email phone')
        .sort({ boostedAt: -1 }),
      Listing.find(normalQuery)
        .populate('owner', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Listing.countDocuments(normalQuery),
    ]);

    const data = [...boostedListings, ...listings];

    res.json({
      success: true,
      count: totalCount + boostedListings.length,
      data,
      boostedCount: boostedListings.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        // Includes boosted listings so the "N spaces found" total on the
        // frontend reflects everything actually shown on the page.
        totalCount: totalCount + boostedListings.length,
        // Page count is driven by the filtered (non-boosted) results only,
        // since boosted listings repeat on every page rather than
        // consuming their own page slots.
        totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
      },
    });
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

// @desc    Get the current user's saved (favorite) listings
// @route   GET /api/listings/saved
// @access  Private
router.get('/saved', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedListings',
      populate: { path: 'owner', select: 'name email phone' },
    });
    const saved = (user?.savedListings || []).filter(Boolean);
    res.json({ success: true, count: saved.length, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Save / bookmark a listing
// @route   POST /api/listings/:id/save
// @access  Private
router.post('/:id/save', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }
    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { savedListings: listing._id } }
    );
    res.json({ success: true, message: 'Listing saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Remove a listing from saved
// @route   DELETE /api/listings/:id/save
// @access  Private
router.delete('/:id/save', protect, async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { savedListings: req.params.id } }
    );
    res.json({ success: true, message: 'Listing removed from saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single listing details
// @route   GET /api/listings/:id
// @access  Public (pending/rejected listings are only visible to their owner or an admin)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('owner', 'name email phone');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.status !== 'approved') {
      const isOwner = req.user && listing.owner._id.toString() === req.user._id.toString();
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ success: false, message: 'Listing not found' });
      }
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

    // Verify ownership (admins may delete any listing)
    if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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

    // Verify ownership (admins may update any listing)
    if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this listing' });
    }

    const {
      title, description, municipality, ward, location, price,
      contactName, isNegotiable,
      propertyType, furnishing, bedrooms, bathrooms, amenities, preferredTenant,
    } = req.body;

    // Resolve the municipality being saved (new value or the existing one) so
    // the ward range is validated against the correct local level.
    const effectiveMunicipality = municipality || listing.municipality;

    // Changing the municipality is only allowed to a currently offered
    // (non-rural) one. A legacy rural value can stay if left unchanged.
    if (municipality && municipality !== listing.municipality && !isActiveMunicipality(municipality)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid municipality',
      });
    }

    if (municipality) listing.municipality = municipality;

    // Parse / validate ward against the effective municipality's ward range
    if (ward) {
      const wardNum = parseInt(ward);
      if (!isValidWard(effectiveMunicipality, wardNum)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid ward number for the chosen municipality',
        });
      }
      listing.ward = wardNum;
    }

    if (isNegotiable !== undefined) {
      listing.isNegotiable = isNegotiable === 'true' || isNegotiable === true;
    }

    if (price !== undefined) {
      listing.price = (isNegotiable === 'true' || isNegotiable === true) && (!price || parseFloat(price) === 0) ? 0 : parseFloat(price);
    }

    // A previously rejected listing goes back into the verification queue
    // once the owner edits it.
    if (listing.status === 'rejected') {
      listing.status = 'pending';
      listing.rejectionReason = '';
    }

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (location) listing.location = location;
    if (contactName) listing.contactName = contactName;
    // Locked: contact phone is always the admin's number (also fixes any
    // older listings that were saved with the owner's own phone).
    listing.contactPhone = BROKER_PHONE;

    // New listing detail fields
    if (propertyType && PROPERTY_TYPES.includes(propertyType)) listing.propertyType = propertyType;
    if (furnishing !== undefined) {
      listing.furnishing = FURNISHING_OPTIONS.includes(furnishing) ? furnishing : '';
    }
    if (bedrooms !== undefined) listing.bedrooms = Math.max(0, parseInt(bedrooms)) || 0;
    if (bathrooms !== undefined) listing.bathrooms = Math.max(0, parseInt(bathrooms)) || 0;
    if (amenities !== undefined) listing.amenities = parseAmenities(amenities);
    if (preferredTenant && TENANT_OPTIONS.includes(preferredTenant)) listing.preferredTenant = preferredTenant;

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
