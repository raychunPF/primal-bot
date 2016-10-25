// =========================================================
// Imports
// =========================================================
var cheerio = require('cheerio');
var request = require('request');
var Async = require('async');

exports.getPreviewImage = function(url, onSuccess, onFail) {
    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var meta = $('meta')
            var keys = Object.keys(meta)
            var ogImage;

            keys.forEach(function(key){
                if (meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property === 'og:image') { ogImage = meta[key].attribs.content; }
            });
            onSuccess(ogImage);
        } else { onFail(response.rawEncoded); }
  });
}

exports.addPreviewImages = function(recommendedContent, onSuccess, onFail) {
    Async.concat(recommendedContent, function(item, callback) {
        if(!item["image"]) {
            exports.getPreviewImage(item["url"], function(imageUrl) {
                item["image"] = imageUrl;
                callback(null, [item]);
            }, function(errorMessage) { onFail(errorMessage); });
        }
        else { callback(null, item); }
    }, function(error, recommendedContent) { onSuccess(recommendedContent); });
}
