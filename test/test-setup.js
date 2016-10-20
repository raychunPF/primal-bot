// Setup config to test methods that use our global config
var konphyg = require("konphyg")(__dirname + "/../config");
global.config = konphyg("app");