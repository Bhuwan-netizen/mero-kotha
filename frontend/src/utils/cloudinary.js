// Inject Cloudinary delivery transformations into a stored image URL so we
// serve small, modern (WebP/AVIF) images instead of the full ~1200px original.
//
// Stored URLs look like:
//   https://res.cloudinary.com/<cloud>/image/upload/v1700000000/mero-kotha/abc.jpg
// After injecting "w_400,f_auto,q_auto":
//   https://res.cloudinary.com/<cloud>/image/upload/w_400,f_auto,q_auto/v1700000000/mero-kotha/abc.jpg
//
// This cuts image delivery bandwidth (the app's main quota cost) by ~5-10x.
// Non-Cloudinary URLs (Unsplash placeholders, legacy /uploads paths) pass
// through untouched.
export const cldImg = (url, transform = 'f_auto,q_auto') => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;

  const [head, tail] = url.split('/image/upload/');
  // If an inline transformation is already present, don't add another.
  const firstSegment = tail.split('/')[0];
  if (firstSegment.includes(',') || /^[a-z]_/.test(firstSegment)) return url;

  return `${head}/image/upload/${transform}/${tail}`;
};

// Common presets used across the app.
export const IMG = {
  card: 'w_400,h_300,c_fill,f_auto,q_auto',      // listing cards
  thumb: 'w_200,h_200,c_fill,f_auto,q_auto',     // small thumbnails / galleries
  adminThumb: 'w_150,h_150,c_fill,f_auto,q_auto', // admin + dashboard rows
  detail: 'w_1000,c_limit,f_auto,q_auto',        // main image on detail page
  edit: 'w_400,f_auto,q_auto',                   // edit-form previews
};
