const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title for your rental space'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description of the space'],
    },
    municipality: {
      type: String,
      required: [true, 'Please select the municipality / rural municipality'],
      trim: true,
    },
    ward: {
      type: Number,
      required: [true, 'Please specify the ward number'],
      min: [1, 'Ward number must be at least 1'],
      max: [15, 'Ward number cannot be more than 15'],
    },
    // Tole / chowk / detailed area within the ward (e.g. "Anarmani Chowk").
    location: {
      type: String,
      required: [true, 'Please add the tole / area location'],
      trim: true,
    },
    propertyType: {
      type: String,
      enum: ['Room', 'Flat', 'Apartment', 'House', 'Shutter/Shop', 'Hostel'],
      required: [true, 'Please select the property type'],
      default: 'Room',
    },
    furnishing: {
      type: String,
      enum: ['Furnished', 'Semi-furnished', 'Unfurnished', ''],
      default: '',
    },
    bedrooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    bathrooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    preferredTenant: {
      type: String,
      enum: ['Any', 'Family', 'Bachelor', 'Students', 'Office'],
      default: 'Any',
    },
    isNegotiable: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: [
        function() { return !this.isNegotiable; },
        'Please specify rent price per month or mark it as negotiable'
      ],
    },
    images: {
      type: [String],
      validate: [
        (val) => val.length <= 2,
        'You can upload up to 2 images only',
      ],
      default: [],
    },
    contactName: {
      type: String,
      required: [true, 'Please add a contact person name'],
    },
    contactPhone: {
      type: String,
      required: [true, 'Please add a contact phone number'],
    },
    // Every new listing must be reviewed by an admin before it appears
    // publicly. Owners can still see their own pending/rejected listings
    // from their Dashboard.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // Optional note from the admin explaining a rejection.
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Listing', ListingSchema);
