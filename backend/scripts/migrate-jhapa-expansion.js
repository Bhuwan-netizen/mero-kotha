/**
 * One-off migration: expand from Birtamode-only to all of Jhapa.
 *
 * Backfills the new fields on any existing listing that predates the
 * Jhapa-wide expansion:
 *   - municipality   -> "Birtamod Municipality" (all old listings were Birtamode)
 *   - propertyType   -> "Room" (safe default; owners can edit afterwards)
 *   - preferredTenant-> "Any"
 *
 * It is non-destructive: it only sets fields that are missing/empty and never
 * touches title, price, images, ward or contact info.
 *
 * Usage (from the backend/ folder, with the same .env used in production):
 *   node scripts/migrate-jhapa-expansion.js
 *
 * Safe to run multiple times (idempotent).
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Listing = require('../models/Listing');

const DEFAULT_MUNICIPALITY = 'Birtamod Municipality';

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // 1) Set municipality on listings that don't have one yet.
  const muniResult = await Listing.updateMany(
    { $or: [{ municipality: { $exists: false } }, { municipality: '' }, { municipality: null }] },
    { $set: { municipality: DEFAULT_MUNICIPALITY } }
  );
  console.log(`municipality backfilled on ${muniResult.modifiedCount} listing(s).`);

  // 2) Set propertyType default where missing.
  const typeResult = await Listing.updateMany(
    { $or: [{ propertyType: { $exists: false } }, { propertyType: '' }, { propertyType: null }] },
    { $set: { propertyType: 'Room' } }
  );
  console.log(`propertyType backfilled on ${typeResult.modifiedCount} listing(s).`);

  // 3) Set preferredTenant default where missing.
  const tenantResult = await Listing.updateMany(
    { $or: [{ preferredTenant: { $exists: false } }, { preferredTenant: '' }, { preferredTenant: null }] },
    { $set: { preferredTenant: 'Any' } }
  );
  console.log(`preferredTenant backfilled on ${tenantResult.modifiedCount} listing(s).`);

  const total = await Listing.countDocuments();
  console.log(`Done. Total listings in DB: ${total}.`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
