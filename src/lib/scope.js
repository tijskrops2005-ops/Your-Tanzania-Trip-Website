// Core set of pages (owner request 2026-11-15): the site must not be a copy of Tanzania Specialist.
// Lodge pages (their texts and the lodges' own photos) and pages without our own rewritten text are
// left out of the build; their URLs redirect (vercel.json, written by scripts/ytt-finish.mjs).
const KEEP = new Set(['/privacy-policy/', '/terms-conditions/', '/our-partner/', '/wishlist/', '/travel-quiz/', '/processing-your-payment/']);
const EXPLICIT = {
  '/accommodations/': '/tanzania-safari/',
  '/review-your-opinion-matters/': '/contact/',
  '/tanzania-traveller-reviews/': '/our-partner/',
  '/activity/a-wonderful-relaxing-day-in-arusha/': '/activities/',
  '/activity/arusha-national-park/': '/national-parks/arusha-national-park/',
  '/activity/hike-in-udzungwa-to-the-sanje-waterfalls/': '/activities/',
  '/activity/lake-manyara-national-park/': '/national-parks/lake-manyara-national-park/',
  '/activity/pemba-island/': '/islands/pemba/',
  '/activity/visit-lake-eyasi-and-the-hadzabe-tribe/': '/activities/',
  '/activity/zanzibar/': '/islands/zanzibar-island/',
  // Academy of the previous operator, presented as ours (audit 2026-11-16): not our project.
  '/practical-information/hakuna-matata-academy/': '/practical-information/responsible-travel/',
};
/** Redirect target for a removed page, or null when the page stays. */
export function removedTarget(path) {
  if (KEEP.has(path)) return null;
  if (EXPLICIT[path]) return EXPLICIT[path];
  if (path.startsWith('/accommodation/')) return '/tanzania-safari/';
  return null;
}
export const isRemoved = path => removedTarget(path) !== null;
