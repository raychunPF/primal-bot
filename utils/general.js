/**
 * Checks if the string is a url
 *
 * @param {string} url The string to check if it is a url
 * @return {boolean} isUrl Indicates if the string is a url
 */
exports.isUrl = function(url) {
    var urlPattern = /^((http|https|ftp):\/\/)/;
    var isUrl = urlPattern.test(url);
    
    return isUrl;
}
