// =========================================================
// Imports
// =========================================================
var konphyg = require('konphyg')(__dirname + '/config');
global.config = konphyg('app');
var restify = require('restify');
var primalAPI = require('./primalAPI.js').primalAPI;
var builder = require('botbuilder');

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
        primalAPI.recommendations(results.response, function(content) {
            session.beginDialog('/carousel', content);
        }, function(error){ console.log(error); });
    }
]);

bot.dialog('/carousel', [
    function(session, results) {
        var prettyCards = [];
        for (var i = 0; i < results.length; i++) {
            var item = results[i];
            prettyCards.push(
                new builder.HeroCard(session)
                    .title(item["title"])
                    .subtitle(item["description"])
                    .images([
                        builder.CardImage.create(session, item["image"])
                            .tap(builder.CardAction.showImage(session, item["image"])),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, decodeURI(item["url"]), "select")
                    ]).tap(builder.CardAction.openUrl(session, decodeURI(item["url"]), "Select"))
            );
        }
        var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(prettyCards);
        
        session.endDialog(msg);
    }
]);
