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
    ward: {
      type: Number,
      required: [true, 'Please specify Birtamode ward number (1-10)'],
      min: [1, 'Ward number must be between 1 and 10'],
      max: [10, 'Ward number must be between 1 and 10'],
    },
    location: {
      type: String,
      required: [true, 'Please add detailed location info'],
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Listing', ListingSchema);
