// =========================================================
// Imports
// =========================================================
var PrimalAPI = require('./primalAPI.js').primalAPI;
var Async = require('async');

// =========================================================
// Static Variables
// =========================================================
var CONFIG = global.config;

/**
 * This service gets recommendations from certain sites using a query
 * and creates an array of recommended content
 *
 * @param {string} query The query to search for recommendations
 * @param {function} onSuccess The function to call on success
 * @param {function} onFail The function to call on fail
 */
exports.querySitesForRecipes = function(message, onSuccess, onFail) {
    Async.concat(CONFIG.FULL_SITE_LIST, function(item, callback) {
        PrimalAPI.recommendations(message, item, function(content) {
            callback(null, content);
        }, function(error) { onFail(error); });
    }, function(error, recommendedContent) { onSuccess(recommendedContent); });
}
