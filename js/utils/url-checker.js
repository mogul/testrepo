/**
 * Check if a URL exists/is reachable
 * A replacement for the url-exists package that doesn't use the 
 * vulnerable request package
 * 
 * @param {string} url - The URL to check
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.timeout=5000] - Timeout in milliseconds
 * @returns {Promise<boolean>} - Promise resolving to true if URL exists
 */
async function urlExists(url, options = {}) {
  const timeout = options.timeout || 5000;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD', // Just get headers, not the body
      signal: controller.signal,
      redirect: 'follow'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false; // URL doesn't exist or there was an error
  }
}

// Export the function for use in other modules
// const { urlExists } = require('./js/utils/url-checker');
module.exports = {
  urlExists
};