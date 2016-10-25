// =========================================================
// Imports
// =========================================================
var PrimalAPI = require('./primalAPI.js').primalAPI;

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
    var contentList = [];
    var numberOfProcessed = 0;
    var siteList = CONFIG.FULL_SITE_LIST;
    
    // We start all of our callbacks at the same time
    siteList.forEach(function(item) {
        PrimalAPI.recommendations(message, item, function(recommendedContent) {
            for(var j = 0; j < recommendedContent.length; j++) {
                contentList.push(recommendedContent[j]);
            }
            numberOfProcessed++;
            
            // We start our onSuccess when we are done all of the callbacks
            if(numberOfProcessed === siteList.length) {
                // We sort our list from highest content score to lowest and take the top 4 results
                contentList.sort(function(a, b) {
                    return b.contentScore - a.contentScore;
                });
                contentList = contentList.slice(0,CONFIG.DISPLAY.maxContentItems);
                onSuccess(contentList);
            }
        },  function(error) { onFail(error); });
    });
}
