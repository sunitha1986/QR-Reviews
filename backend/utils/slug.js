/**
 * Generates a URL-friendly lowercase slug from text (e.g. "Children Clinic" -> "children-clinic")
 */
function generateSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export {
  generateSlug
};
export default generateSlug;
