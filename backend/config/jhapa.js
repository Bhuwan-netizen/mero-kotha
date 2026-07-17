// Jhapa district administrative data + shared listing option lists (backend copy).
// Mirrors frontend/src/constants/jhapa.js. Used for server-side validation.

const JHAPA_LOCAL_LEVELS = [
  // Municipalities (Nagarpalika)
  { name: 'Mechinagar Municipality', type: 'Municipality', wards: 15 },
  { name: 'Birtamod Municipality', type: 'Municipality', wards: 10 },
  { name: 'Damak Municipality', type: 'Municipality', wards: 10 },
  { name: 'Bhadrapur Municipality', type: 'Municipality', wards: 10 },
  { name: 'Arjundhara Municipality', type: 'Municipality', wards: 11 },
  { name: 'Shivasatakshi Municipality', type: 'Municipality', wards: 11 },
  { name: 'Kankai Municipality', type: 'Municipality', wards: 9 },
];

// These are no longer accepted for NEW listings, but existing listings saved
// with one must keep working (viewing, filtering by search, owner edits that
// don't change the municipality). They're kept here for ward validation of
// legacy data only.
const LEGACY_LOCAL_LEVELS = [
  { name: 'Gauradaha Municipality', type: 'Municipality', wards: 9 },
  { name: 'Kamal Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Barhadashi Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Jhapa Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Kachankawal Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Buddhashanti Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Gauriganj Rural Municipality', type: 'Rural Municipality', wards: 6 },
  { name: 'Haldibari Rural Municipality', type: 'Rural Municipality', wards: 5 },
];

const ALL_LOCAL_LEVELS = [...JHAPA_LOCAL_LEVELS, ...LEGACY_LOCAL_LEVELS];

const MUNICIPALITY_NAMES = JHAPA_LOCAL_LEVELS.map((m) => m.name);

// True only for the currently offered (non-rural) municipalities.
const isActiveMunicipality = (municipality) =>
  JHAPA_LOCAL_LEVELS.some((m) => m.name === municipality);

const getWardCount = (municipality) => {
  const found = ALL_LOCAL_LEVELS.find((m) => m.name === municipality);
  return found ? found.wards : 0;
};

// Reduce a municipality string to a comparable "core" form: lower-cased, with
// the trailing "Municipality" / "Rural Municipality" suffix and surrounding
// whitespace removed. So "Birtamod Municipality", " birtamod ", and
// "Birtamod" all collapse to "birtamod".
const coreMunicipality = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+(rural\s+)?municipality$/i, '')
    .trim()
    .toLowerCase();

// Known alternate spellings -> canonical core, so historical data still matches.
const MUNICIPALITY_ALIASES = {
  birtamode: 'birtamod', // older "Birtamode" spelling used before the rename
  birtamoad: 'birtamod',
};

const canonicalCore = (value) => {
  const core = coreMunicipality(value);
  return MUNICIPALITY_ALIASES[core] || core;
};

// Build a Mongo query matcher for a selected municipality that is tolerant of
// how the value was stored: different casing, a missing "Municipality" suffix,
// or an older spelling variant. Returns either a plain string (exact, when the
// name is unknown) or a case-insensitive regex anchored to the core name.
//
// This fixes listings that were saved before the Jhapa-wide expansion and so
// don't match the dropdown value character-for-character, which previously
// caused them to be hidden when a municipality was selected.
const buildMunicipalityMatcher = (selected) => {
  const core = canonicalCore(selected);
  if (!core) return selected;

  // Collect every stored spelling that should map to this core (the canonical
  // core plus any aliases that resolve to it).
  const variants = new Set([core]);
  Object.keys(MUNICIPALITY_ALIASES).forEach((alias) => {
    if (MUNICIPALITY_ALIASES[alias] === core) variants.add(alias);
  });

  const escaped = [...variants].map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const alternation = escaped.join('|');
  // Match the core name optionally followed by a "Municipality" suffix.
  return {
    $regex: `^\\s*(${alternation})(\\s+(rural\\s+)?municipality)?\\s*$`,
    $options: 'i',
  };
};

// True if the municipality exists and the ward is within its valid range.
const isValidWard = (municipality, ward) => {
  const count = getWardCount(municipality);
  return count > 0 && Number.isInteger(ward) && ward >= 1 && ward <= count;
};

const PROPERTY_TYPES = ['Room', 'Flat', 'Apartment', 'House', 'Shutter/Shop', 'Hostel'];
const FURNISHING_OPTIONS = ['Furnished', 'Semi-furnished', 'Unfurnished'];
const TENANT_OPTIONS = ['Any', 'Family', 'Bachelor', 'Students', 'Office'];
const AMENITIES = [
  'Parking',
  '24hr Water',
  'WiFi',
  'Attached Bathroom',
  'Kitchen',
  'Balcony',
  'Electricity Backup',
  'Water Tank',
  'Hot Water',
  'CCTV',
  'Rooftop Access',
  'Pet Friendly',
];

module.exports = {
  JHAPA_LOCAL_LEVELS,
  LEGACY_LOCAL_LEVELS,
  MUNICIPALITY_NAMES,
  isActiveMunicipality,
  getWardCount,
  isValidWard,
  coreMunicipality,
  canonicalCore,
  buildMunicipalityMatcher,
  PROPERTY_TYPES,
  FURNISHING_OPTIONS,
  TENANT_OPTIONS,
  AMENITIES,
};
