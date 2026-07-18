const mongoose = require('mongoose');

// Site-wide service pricing, set by the admin from the Admin Panel and shown
// publicly in the Pricing modal. Stored as a single settings document.
const PricingSchema = new mongoose.Schema(
  {
    // Plans for property owners who list their space (NPR).
    ownerWeekly: {
      type: Number,
      min: 0,
      default: 0,
    },
    ownerBiWeekly: {
      type: Number,
      min: 0,
      default: 0,
    },
    ownerMonthly: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Price customers pay for viewing / getting info about a room or property (NPR).
    customerViewingPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Optional free-text offer / discount lines (left empty unless there is
    // a running promotion, e.g. "20% off monthly plan this Dashain").
    ownerOffer: {
      type: String,
      trim: true,
      default: '',
    },
    customerOffer: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// There is only ever one pricing document. Helper to fetch-or-create it.
PricingSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('Pricing', PricingSchema);
