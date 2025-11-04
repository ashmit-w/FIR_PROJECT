/**
 * Utility functions for police station name normalization
 * Ensures consistent uppercase formatting to match database schema
 */

/**
 * Normalize police station name to uppercase
 * This ensures case-insensitive matching with database values
 * @param {string} stationName - The police station name to normalize
 * @returns {string} - Normalized station name in uppercase, or original if null/undefined
 */
const normalizeStationName = (stationName) => {
  if (!stationName) return stationName;
  // Convert to uppercase to match database format
  return stationName.toUpperCase().trim();
};

/**
 * Normalize an array of police station names
 * @param {string[]} stationNames - Array of police station names
 * @returns {string[]} - Array of normalized station names
 */
const normalizeStationNames = (stationNames) => {
  if (!Array.isArray(stationNames)) return stationNames;
  return stationNames.map(name => normalizeStationName(name));
};

/**
 * Compare two police station names in a case-insensitive manner
 * @param {string} station1 - First station name
 * @param {string} station2 - Second station name
 * @returns {boolean} - True if names match (case-insensitive)
 */
const compareStationNames = (station1, station2) => {
  if (!station1 || !station2) return station1 === station2;
  return normalizeStationName(station1) === normalizeStationName(station2);
};

/**
 * Check if a station name is in an array of station names (case-insensitive)
 * @param {string} stationName - Station name to check
 * @param {string[]} stationArray - Array of station names
 * @returns {boolean} - True if station is in array
 */
const isStationInArray = (stationName, stationArray) => {
  if (!stationName || !Array.isArray(stationArray)) return false;
  const normalizedName = normalizeStationName(stationName);
  return stationArray.some(station => normalizeStationName(station) === normalizedName);
};

module.exports = {
  normalizeStationName,
  normalizeStationNames,
  compareStationNames,
  isStationInArray
};

