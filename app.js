// =========================================================
// Imports
// =========================================================
var konphyg = require('konphyg')(__dirname + '/config');
global.config = konphyg('app');
var restify = require('restify');
var builder = require('botbuilder');
var search = require('./search.js');
var scraper = require('./utils/imageScraper.js');
var utils = require('./utils/general.js')

// =========================================================
// Static Variables
// =========================================================
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
bot.beginDialogAction('reset', '/reset');

//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', [
    function(session, args, next) {
        if (!session.userData.name) {
            session.privateConversationData["running"] = true;
            session.beginDialog("/firstRun");
        } else {
            next();
        } 
    },
    function(session, args, next) {
        if (session.userData.name && !session.privateConversationData.running) {
            session.privateConversationData["running"] = true;
            builder.Prompts.text(session, "Welcome back " + session.userData.name + ", give me the name of a dish and I'll find some recipes.");
        } else {
            next({response: ""});
        } 
    },
    function(session, results) {
        session.beginDialog('/recommendation', { response: results.response });
    }
]);

bot.dialog("/goodbye", [
    function(session) {
        // Always say goodbye
        // Clears everything in session.privateConversationData
        session.endConversation("Ok %s, see you later!", session.userData.name);
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
        session.endDialog(); 
    }
]);

bot.dialog('/recommendation', [
    // Check if dish name was passed in
    function(session, args, next) {
        // This block is used to catch any queries from the user that is sent
        // when the bot is busy (preventing any errors)
        if (typeof args === "undefined") {
            if (typeof session.message.text === "undefined") {
                console.log("Error: Ending recommendation because we can't find a query to search for");
                session.endDialog();
            } else {
                var args = {
                    response: session.message.text
                };
            }
        }
        
        if ((!args.response || args.response === "") && !args.error) {
            builder.Prompts.text(session, "Hey " + session.userData.name + ", give me the name of a dish and I'll find some recipes.");
        } else if (args.error) {
            if (args.error === "noContent") {
                builder.Prompts.text(session, "There were no results for " + args.response + "... Try searching for a different dish");
            } else {
                builder.Prompts.text(session, "There seems to be an error... Try searching for a different dish");
            }
        } else {
            next({response: args.response});
        }
    },
    // Query for sites with recipes on dish
    function(session, results) {
        session.dialogData.dish = results.response;
        // Indicate to user that bot is typing
        session.sendTyping();
        search.querySitesForRecipes(session.dialogData.dish, function(content) {
            if (content.length === 0) {
                session.replaceDialog("/recommendation", { response: session.dialogData.dish, error: "noContent" });
            }
            session.beginDialog("/carousel", { cards: content });
        }, function(error){
            session.replaceDialog("/recommendation", { response: "", error: error.status });
        });
    },
    function(session) {
        if (utils.isUrl(session.dialogData.dish)) {
            builder.Prompts.text(session, "Alright " + session.userData.name + ", here are some recipes similar to that! Give me another dish or say quit if you want to stop.");
        }
        else{
            builder.Prompts.text(session, "Hey " + session.userData.name + ", here are a couple " + session.dialogData.dish + " recipes. Give me another dish or say quit if you want to stop.");
        }
    },
    function(session, results) {
        // Loop recommendations
        if (/^quit/i.test(results.response)) {
            session.beginDialog("/goodbye");
        } else {
            session.replaceDialog("/recommendation", { response: results.response });
        }
    }
]);

bot.dialog('/carousel', [
    function(session, args) {
        // The user might message something when in the carousel dialog, if so ignore.
        if ((!args || !args.cards) && session.sessionState.callstack[2]) {
            session.cancelDialog(session.sessionState.callstack[2]);
        } else {
            scraper.addPreviewImages(args.cards, function(content) {
                var prettyCards = [];
                for (var i = 0; i < content.length; i++) {
                    var item = content[i];
                    var contentURL = decodeURIComponent(item["url"].substr(item["url"].indexOf('r=')+2));
                    prettyCards.push(
                        new builder.HeroCard(session)
                            .title(item["title"])
                            .subtitle(item["publisher"])
                            .text(item["description"])
                            .images([ builder.CardImage.create(session, item["image"]) ])
                            .tap(builder.CardAction.openUrl(session, decodeURI(item["url"]), item["publisher"]))
                            .buttons([
                                builder.CardAction.imBack(session, contentURL, "More like this...")
                            ])
                    );
                }
                var msg = new builder.Message(session)
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(prettyCards);
                
                session.endDialog(msg);
            }, function(errorMessage) { console.log(errorMessage); });
        }
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
        // Clear the dialog stack, and start at recommendation
        session.cancelDialog(0, '/recommendation', "");
    }
]);

bot.dialog("/reset", [
    function(session) {
        session.send("reseting...")
        delete session.userData;
        session.endConversation("reset");
    }
]);
