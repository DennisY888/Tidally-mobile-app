// functions/helpers.js

/**
 * Generates an array of all possible substrings for a given text.
 * Converts text to lowercase to ensure case-insensitive search.
 * @param {string} text The text to generate substrings from.
 * @return {string[]} An array of unique substrings.
 */
function generateSubstrings(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const lowercasedText = text.toLowerCase();
  const substrings = new Set(); // Use a Set to store unique values

  for (let i = 0; i < lowercasedText.length; i++) {
    for (let j = i + 1; j <= lowercasedText.length; j++) {
      substrings.add(lowercasedText.substring(i, j));
    }
  }

  return Array.from(substrings);
}

module.exports = {generateSubstrings};
