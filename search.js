// =========================================================
// Imports
// =========================================================
var PrimalAPI = require('./primalAPI.js').primalAPI;

// =========================================================
// Static Variables
// =========================================================
var CONFIG = global.config;

exports.querySitesForRecipes = function(message, onSuccess, onFail) {
    var contentList = [];
    var count = 0;
    var siteList = CONFIG.FULL_SITE_LIST;
    
    for(var i = 0; i < siteList.length; i++) {
        count++;
        PrimalAPI.recommendations(message, siteList[i], function(content) {
            for(var j = 0; j < content.length; j++) {
                contentList.push(content[j]);
            }
            count --;
            
            if(count == 0) {
                contentList.sort(function(a, b) {
                    return b.contentScore - a.contentScore;
                });
                contentList = contentList.slice(0,4);
                onSuccess(contentList);
            }
        },  function(error){ console.log(error); });
    }
}
