// =========================================================
// Imports
// =========================================================
var konphyg = require('konphyg')(__dirname + '/config');
global.config = konphyg('app');
var restify = require('restify');
var builder = require('botbuilder');
var search = require('./search.js');
var scraper = require('./utils/imageScraper.js');

// **** Static Variables
var CONFIG = global.config;

// =========================================================
// Bot Setup
// =========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});
  
// For Bot Framework Service
var connector = new builder.ChatConnector({
    appId: config.MICROSOFT_APP_ID,
    appPassword: config.MICROSOFT_APP_PASSWORD
});


var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', [
    function (session) {
        session.beginDialog('/recommendation');
    }
]);

bot.dialog('/recommendation', [
    function(session) {
        builder.Prompts.text(session, "Hello, enter a keyword you want to search for");
    },
    function(session, results) {
        search.querySitesForRecipes(results.response, function(content){
            session.beginDialog('/carousel', content);
        }, function(){});
    }
]);

bot.dialog('/carousel', [
    function(session, results) {
        scraper.addPreviewImages(results, function(content) {
            var prettyCards = [];
            for (var i = 0; i < content.length; i++) {
                var item = content[i];
                prettyCards.push(
                    new builder.HeroCard(session)
                        .title(item["title"])
                        .subtitle(item["publisher"])
                        .text(item["description"])
                        .images([ builder.CardImage.create(session, item["image"]) ])
                        .tap(builder.CardAction.openUrl(session, decodeURI(item["url"]), item["publisher"]))
                );
            }
            var msg = new builder.Message(session)
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(prettyCards);
            
            session.endDialog(msg);
        }, function() {console.log("err"); });
    }
]);
