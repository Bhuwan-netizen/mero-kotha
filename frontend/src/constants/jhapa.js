// Jhapa district administrative data + shared listing option lists.
// Used across Home filters and the Create / Edit listing forms.
//
// Ward counts are the official number of wards in each local level.
// Sources: Jhapa District (Wikipedia), Jankari Nepal local-government list,
// and individual municipality/rural-municipality records (verified Jun 2026).

export const JHAPA_LOCAL_LEVELS = [
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

// Flat list of names (used for <select> options and validation).
export const MUNICIPALITY_NAMES = JHAPA_LOCAL_LEVELS.map((m) => m.name);

// How many wards a given local level has (0 if unknown).
export const getWardCount = (municipality) => {
  const found = JHAPA_LOCAL_LEVELS.find((m) => m.name === municipality);
  return found ? found.wards : 0;
};

// Array [1..wardCount] for building ward dropdowns that depend on municipality.
export const getWardOptions = (municipality) => {
  const count = getWardCount(municipality);
  return Array.from({ length: count }, (_, i) => i + 1);
};

export const PROPERTY_TYPES = [
  'Room',
  'Flat',
  'Apartment',
  'House',
  'Shutter/Shop',
  'Hostel',
];

export const FURNISHING_OPTIONS = ['Furnished', 'Semi-furnished', 'Unfurnished'];

export const TENANT_OPTIONS = ['Any', 'Family', 'Bachelor', 'Students', 'Office'];

export const AMENITIES = [
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
