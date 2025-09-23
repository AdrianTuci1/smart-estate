/**
 * Utility functions for text normalization in Romanian
 * Handles diacritics removal and case-insensitive comparisons
 */

// Romanian diacritics mapping
const diacriticsMap = {
  'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
  'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T'
};

/**
 * Normalize text by removing diacritics and converting to lowercase
 * @param {string} text - The text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .split('')
    .map(char => diacriticsMap[char] || char)
    .join('');
}

/**
 * Check if a text contains a search term (case-insensitive and diacritic-insensitive)
 * @param {string} text - The text to search in
 * @param {string} searchTerm - The term to search for
 * @returns {boolean} - True if the text contains the search term
 */
function containsNormalized(text, searchTerm) {
  const normalizedText = normalizeText(text);
  const normalizedSearchTerm = normalizeText(searchTerm);
  return normalizedText.includes(normalizedSearchTerm);
}

/**
 * Check if a text starts with a search term (case-insensitive and diacritic-insensitive)
 * @param {string} text - The text to check
 * @param {string} searchTerm - The term to check for
 * @returns {boolean} - True if the text starts with the search term
 */
function startsWithNormalized(text, searchTerm) {
  const normalizedText = normalizeText(text);
  const normalizedSearchTerm = normalizeText(searchTerm);
  return normalizedText.startsWith(normalizedSearchTerm);
}

/**
 * Check if two texts are equal (case-insensitive and diacritic-insensitive)
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {boolean} - True if texts are equal after normalization
 */
function equalsNormalized(text1, text2) {
  const normalizedText1 = normalizeText(text1);
  const normalizedText2 = normalizeText(text2);
  return normalizedText1 === normalizedText2;
}

/**
 * Sort an array of objects by a text field (case-insensitive and diacritic-insensitive)
 * @param {Array} array - Array to sort
 * @param {string} field - Field name to sort by
 * @param {boolean} ascending - Sort order (default: true)
 * @returns {Array} - Sorted array
 */
function sortByNormalizedText(array, field, ascending = true) {
  return array.sort((a, b) => {
    const textA = normalizeText(a[field] || '');
    const textB = normalizeText(b[field] || '');
    
    if (textA < textB) return ascending ? -1 : 1;
    if (textA > textB) return ascending ? 1 : -1;
    return 0;
  });
}

module.exports = {
  normalizeText,
  containsNormalized,
  startsWithNormalized,
  equalsNormalized,
  sortByNormalizedText
};
