/**
 * Converts a string to a clean URL-friendly lowercase slug
 * e.g. "Children Clinic" -> "children-clinic"
 *      "Taj Hotel & Resort" -> "taj-hotel-resort"
 *      "Dr. Smile's Dental Care" -> "dr-smiles-dental-care"
 */
export function generateSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars except spaces and dashes
    .replace(/[\s_-]+/g, '-')   // replace spaces, underscores, multiple dashes with single dash
    .replace(/^-+|-+$/g, '');   // trim leading/trailing dashes
}

export function getClientReviewUrl(clientOrName, qrId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const name = typeof clientOrName === 'string' ? clientOrName : clientOrName?.name;
  const slug = (typeof clientOrName === 'object' && clientOrName?.slug) ? clientOrName.slug : generateSlug(name);
  const target = slug || qrId || (typeof clientOrName === 'object' ? clientOrName?.qrId : '');
  return `${origin}/${target}`;
}
