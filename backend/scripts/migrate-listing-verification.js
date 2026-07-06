/**
 * One-off migration: introduce the listing verification workflow.
 *
 * New listings now default to status "pending" and only become publicly
 * visible once an admin approves them. Without this migration, every
 * listing that existed *before* this change would suddenly disappear from
 * the public site (Mongoose's schema default only applies to documents
 * created after the default was added, not existing ones).
 *
 * This backfills status = "approved" on every listing that doesn't
 * already have a status set, so nothing already live gets hidden. Going
 * forward, only newly created listings start out "pending".
 *
 * Usage (from the backend/ folder, with the same .env used in production):
 *   node scripts/migrate-listing-verification.js
 *
 * Safe to run multiple times (idempotent).
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Listing = require('../models/Listing');

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const result = await Listing.updateMany(
    { $or: [{ status: { $exists: false } }, { status: null }, { status: '' }] },
    { $set: { status: 'approved' } }
  );
  console.log(`status backfilled to "approved" on ${result.modifiedCount} pre-existing listing(s).`);

  const total = await Listing.countDocuments();
  const pending = await Listing.countDocuments({ status: 'pending' });
  console.log(`Done. Total listings: ${total}. Currently pending: ${pending}.`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
