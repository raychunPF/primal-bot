// Imports
var utils = require("./utils/general.js");
var rest = require("restler");

// Static Variables
var CONFIG = global.config;

primalAPI = rest.service(
    // service constructor
    function() {
    },
    {
        headers: {
            "Accept": "application/json",                
            "Primal-App-Key": CONFIG.primalAPI.PRIMAL_APP_KEY,
            "Primal-App-ID": CONFIG.primalAPI.PRIMAL_APP_ID,
            "Authorization": CONFIG.primalAPI.AUTHORIZATION
        }
    },
    // service methods
    {
        /**
         * Api call to primal recommendations
         *
         * @param {string} message The message to search for recommendations
         * @param {string} onSuccess The function to call on success
         * @param {string} onFail The function to call on fail
         */
        recommendations: function(message, site, onSuccess, onFail) {
            var formattedMessage = _formatMessage(message);
            // As hacky as this code looks, according to http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
            // it is the most efficient method somehow
            var queryStrings = JSON.parse(JSON.stringify(CONFIG.RECOMMENDATIONS.PARAMS));
            queryStrings[formattedMessage.type] = formattedMessage.message;
            if(site)
              queryStrings['site'] = site;
            
            this.get(CONFIG.RECOMMENDATIONS.URL, {"query": queryStrings}).on("success", function(data, response) {
                var cards = [];
                for (var i = 0; i < data["@graph"].length; i++) {
                    var item = data["@graph"][i];
                    if (item["@type"] === "content") {
                        cards.push(item);
                    }
                }
                onSuccess(cards);
            }).on("fail", function(data, response) {
                // TODO more efficient way of handling success, fail, error, and maybe timeout
                onFail(response.rawEncoded);
            }).on("error", function(data, response) {
                onFail(response.rawEncoded);
            });
        }
    }
);

/**
 * Checks if the given message is a url or query
 *
 * @param {string} message The string to format as url or query
 * @return {object} formattedMessage An object with a formatted message in message 
 *                                   message type in type
 */
function _formatMessage(message) {
    // Check if url, else the message is a query
    if (utils.isUrl(message)) {
        return { "message": encodeURI(message), "type": "u" };
    } else {
        return { "message": message.split(' ').join('+'), "type": "q" };
    }
}

exports.primalAPI = new primalAPI();
