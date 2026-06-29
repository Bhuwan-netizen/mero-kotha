/**
 * One-off migration: normalize every listing's `municipality` value.
 *
 * Why: the listings API filters by municipality. If a listing's stored
 * municipality string doesn't exactly match one of the canonical names
 * (e.g. it's empty, lower-cased, missing the "Municipality" suffix, or uses
 * the older "Birtamode" spelling), selecting that municipality on the Home
 * page would silently hide the listing. That's why only a subset of listings
 * (the newest ones, saved with the current form) appeared for Birtamod.
 *
 * What it does, for every listing:
 *   - Empty / missing municipality  -> "Birtamod Municipality"
 *     (all pre-expansion listings were in Birtamode; same assumption the
 *      original migrate-jhapa-expansion.js script makes).
 *   - A value that maps to a known local level (by case-insensitive core name,
 *     ignoring the "Municipality"/"Rural Municipality" suffix and the
 *     Birtamode/Birtamod spelling) -> the canonical full name.
 *   - Anything it can't confidently map is left untouched and reported, so you
 *     can fix it by hand.
 *
 * Non-destructive otherwise: never touches title, price, images, ward, type or
 * contact info. Safe to run multiple times (idempotent).
 *
 * Usage (from the backend/ folder, with the production .env):
 *   node scripts/normalize-municipalities.js
 *
 * Dry run (report what WOULD change, write nothing):
 *   node scripts/normalize-municipalities.js --dry
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Listing = require('../models/Listing');
const {
  JHAPA_LOCAL_LEVELS,
  canonicalCore,
} = require('../config/jhapa');

const DEFAULT_MUNICIPALITY = 'Birtamod Municipality';
const DRY_RUN = process.argv.includes('--dry');

// Map a canonical core name (e.g. "birtamod") -> the canonical full name.
const coreToFullName = {};
JHAPA_LOCAL_LEVELS.forEach((level) => {
  coreToFullName[canonicalCore(level.name)] = level.name;
});

// Decide what a given stored municipality value SHOULD become.
// Returns the canonical name, or null if it can't be confidently resolved.
const resolveCanonical = (value) => {
  if (!value || !String(value).trim()) return DEFAULT_MUNICIPALITY;
  const core = canonicalCore(value);
  return coreToFullName[core] || null;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to MongoDB.${DRY_RUN ? '  (DRY RUN — no writes)' : ''}`);

  const listings = await Listing.find({}).select('municipality title');
  console.log(`Scanning ${listings.length} listing(s)...\n`);

  let changed = 0;
  let unchanged = 0;
  const unresolved = [];

  for (const listing of listings) {
    const current = listing.municipality || '';
    const target = resolveCanonical(current);

    if (target === null) {
      unresolved.push({ id: listing._id.toString(), value: current, title: listing.title });
      continue;
    }

    if (target === current) {
      unchanged += 1;
      continue;
    }

    console.log(`  "${current || '(empty)'}"  ->  "${target}"   [${listing.title}]`);
    if (!DRY_RUN) {
      listing.municipality = target;
      await listing.save();
    }
    changed += 1;
  }

  console.log(`\n${DRY_RUN ? 'Would change' : 'Changed'}: ${changed}`);
  console.log(`Already canonical: ${unchanged}`);

  if (unresolved.length) {
    console.log(`\n${unresolved.length} listing(s) could NOT be auto-mapped (left untouched):`);
    unresolved.forEach((u) => console.log(`  [${u.id}] municipality="${u.value}"  (${u.title})`));
    console.log('Edit these manually, or extend MUNICIPALITY_ALIASES in config/jhapa.js.');
  }

  await mongoose.disconnect();
  console.log('\nDone.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Normalization failed:', err);
  process.exit(1);
});
