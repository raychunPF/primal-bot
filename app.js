var konphyg = require('konphyg')(__dirname + '/config');
global.config = konphyg('app');
var restify = require('restify');
var rest = require('restler');
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
        // Root route
        session.beginDialog('/recommendation');
    }
]);

bot.dialog('/recommendation', [
    function(session) {
        builder.Prompts.text(session, "Hello, enter a keyword you want to search for");
    },
    function(session, results) {
        var options = {
            headers: {
                'Accept': 'application/json',
                "Primal-App-Key": '7937a89b05c597d2eb3ff9ac26a3f0a4',
                "Primal-App-ID": '32123c3d',
                "Authorization": 'Basic cmF5LmNodW46MTIzNDU2'
            }
        }
        
        rest.get("https://api.primal.com/v2/recommendations?q=" + results.response, options).on('complete', function(data, response) {
            var cards = [];
            for (var i = 0; i < data["@graph"].length; i++) {
                var item = data["@graph"][i];
                if (item["@type"] === "content") {
                    cards.push(item);
                }
            }
            session.beginDialog('/carousel', cards);
        });
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
                    ])
            );
        }
        var msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(prettyCards);
        
        session.endDialog(msg);
    }
]);
