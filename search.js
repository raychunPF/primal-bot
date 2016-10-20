var konphyg = require('konphyg')(__dirname + '/config');
global.config = konphyg('app');
var PrimalAPI = require('./primalAPI.js').primalAPI;
var resources = konphyg('resource-list');

exports.querySitesForRecipes = function(message, onSuccess, onFail) {
    var contentList = [];
    var count = 0;
    var siteList = resources['full-site-list'];
    
    function searchRecipeSite() {
        if( count < siteList.length){
            PrimalAPI.recommendations(message, siteList[count], function(content) {
                for(var j=0; j<content.length; j++){
                    contentList.push(content[j]);
                }
                count += 1;
                searchRecipeSite();
            },  function(error){ console.log(error); });
        }
        else {
            contentList.sort(function(a, b) { 
                return b.contentScore - a.contentScore;
            });
            contentList = contentList.slice(0,4);
            onSuccess(contentList);
        }
    }
    
    searchRecipeSite();
}