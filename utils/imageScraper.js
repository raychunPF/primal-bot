var cheerio = require('cheerio')
var request = require('request')

exports.getPreviewImage = function(url, onSuccess, onFail) {
    request(url, function (error, response, html) {
        if (!error && response.statusCode == 200) {
            // console.log(html);
            var $ = cheerio.load(html);
            var meta = $('meta')
            var keys = Object.keys(meta)
            var ogImage;

            keys.forEach(function(key){
                if (meta[key].attribs && meta[key].attribs.property && meta[key].attribs.property === 'og:image') { ogImage = meta[key].attribs.content; }
            });
            onSuccess(ogImage);
        }
        else { onFail(response.rawEncoded); }
  });
}

exports.addPreviewImages = function(content, onSuccess, onFail) {
    var i = 0;
  
    function recurse() {
        if(i < content.length){
            var item = content[i];
            if(!item["image"]){
                exports.getPreviewImage(item["url"], function(imageUrl) {
                    content[i]["image"] = imageUrl;
                    i += 1;
                    recurse();
                }, function(message) { console.log(message); onFail(); });
            }
        }
        else { onSuccess(content); }
    }
    recurse();
}