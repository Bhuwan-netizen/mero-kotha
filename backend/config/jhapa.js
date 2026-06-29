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
  { name: 'Gauradaha Municipality', type: 'Municipality', wards: 9 },
  // Rural Municipalities (Gaunpalika)
  { name: 'Kamal Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Barhadashi Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Jhapa Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Kachankawal Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Buddhashanti Rural Municipality', type: 'Rural Municipality', wards: 7 },
  { name: 'Gauriganj Rural Municipality', type: 'Rural Municipality', wards: 6 },
  { name: 'Haldibari Rural Municipality', type: 'Rural Municipality', wards: 5 },
];

const MUNICIPALITY_NAMES = JHAPA_LOCAL_LEVELS.map((m) => m.name);

const getWardCount = (municipality) => {
  const found = JHAPA_LOCAL_LEVELS.find((m) => m.name === municipality);
  return found ? found.wards : 0;
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
  MUNICIPALITY_NAMES,
  getWardCount,
  isValidWard,
  PROPERTY_TYPES,
  FURNISHING_OPTIONS,
  TENANT_OPTIONS,
  AMENITIES,
};
