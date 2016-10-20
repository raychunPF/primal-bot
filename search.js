var konphyg = require('konphyg')(__dirname + '/config');
var PrimalAPI = require('./primalAPI.js').primalAPI;
var resources = konphyg('resource-list');

exports.querySitesForRecipes = function(message, onSuccess, onFail) {
    var contentList = [];
    var count = 0;
    var siteList = resources['full-site-list'];
    
    function searchRecipeSite() {
        for(var i=0; i<resources['full-site-list'].length; i++){
            count++;
            PrimalAPI.recommendations(message, siteList[i], function(content) {
                for(var j=0; j<content.length; j++){
                    contentList.push(content[j]);
                }
                count --;
                
                if(count == 0){
                    contentList.sort(function(a, b) { 
                        return b.contentScore - a.contentScore;
                    });
                    contentList = contentList.slice(0,4);
                    onSuccess(contentList);
                }
            },  function(error){ console.log(error); });
        }
    }
    
    searchRecipeSite();
}