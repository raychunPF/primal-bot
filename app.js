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
// Bots Global Actions
//=========================================================

bot.beginDialogAction('changeName', '/changeName', { matches: /^name|change name/i });

//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', [
    function(session, results, next) {
        if (!session.userData.name) {
            session.beginDialog("/firstRun");
        } else {
            next();
        } 
    },
    function(session, results, next) {
        if (session.userData.name && !session.privateConversationData.running) {
            session.privateConversationData.running = true;
            session.send("Welcome back %s, give me the name of a dish and I'll find some recipes.", session.userData.name);
        } else {
            next();
        } 
    },
    function(session) {
        session.dialogData.text = session.message.text || "";
        session.beginDialog('/recommendation', session.dialogData.text);
    },
    function(session) {
        // TODO: May be impossible to reach this point, investigate and delete if needed
        session.beginDialog("/goodbye");
    }
]);

bot.dialog("/goodbye", [
    function(session) {
        // Always say goodbye
        session.send("Ok %s, see you later!", session.userData.name);
        session.endConversation();
    }
]);

bot.dialog("/firstRun", [
    function(session) {
        builder.Prompts.text(session, "Hi! I'm the Recipe Bot. I'll help you find recipes across the web. But first, what's your name?");
    },
    function(session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.
        session.userData.name = results.response;
        session.endDialog("Hi %s, give me the name of a dish and I'll find some recipes.", session.userData.name); 
    }
]);

bot.dialog('/recommendation', [
    // Check if dish name was passed in
    function(session, args, next) {
        session.dialogData.dish = args;
        if (!session.dialogData.dish || session.dialogData.dish === "") {
            builder.Prompts.text(session, "Hey " + session.userData.name + ", give me the name of a dish and I'll find some recipes.");
        } else {
            next({response: session.dialogData.dish});
        }
    },
    // Query for sites with recipes on dish
    function(session, results) {
        session.dialogData.dish = results.response;
        search.querySitesForRecipes(results.response, function(content){
            session.beginDialog("/carousel", content);
        }, function(){});
    },
    function(session) {
        builder.Prompts.text(session, "Alright " + session.userData.name + ", here are a couple " + session.dialogData.dish + " recipes. Give me another dish or say quit if you want to stop.");
    },
    function(session, results) {
        // Loop recommendations
        if (/^quit/i.test(results.response)) {
            session.beginDialog("/goodbye");
        } else {
            session.replaceDialog("/recommendation", results.response);
        }
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

bot.dialog("/changeName", [
    function(session) {
        if (!session.userData.name) {
            session.beginDialog("/firstRun");
        } else {
            builder.Prompts.text(session, "What do you want me to call you?");
        }
    },
    function(session, results) {
        session.userData.name = results.response;
        session.cancelDialog(0, '/recommendation');
    }
]);
