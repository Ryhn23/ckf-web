/**
 * Buat slug URL-safe dari string.
 * @param {string} text
 * @param {string} [replacement]
 */
export function slugify(text, replacement = '-') {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // buang diakritik
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, replacement)
    .replace(new RegExp(`\\${replacement}{1,}`, 'g'), replacement)
    .replace(/^[&%]-?/, '')
    .replace(/^-$/, '');
}

export default slugify;
