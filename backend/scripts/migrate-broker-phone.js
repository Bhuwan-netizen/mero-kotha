// One-time migration: point every existing listing's contact phone at the
// admin (broker) number so all inquiries go through Mero Kotha.
//
// Run from the backend folder:  node scripts/migrate-broker-phone.js

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const BROKER_PHONE = '9815910188';

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await Listing.updateMany(
      { contactPhone: { $ne: BROKER_PHONE } },
      { $set: { contactPhone: BROKER_PHONE } }
    );

    console.log(`Updated ${result.modifiedCount} listing(s) to contact phone ${BROKER_PHONE}`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
