// Test setup
var testHome = "../test";
require(testHome + "/test-setup");
var general = require("../utils/general.js");

describe("Primal Utility Methods", function() {
    describe("Testing general utility methods", function() {    
        it("should indicate if url", function() {
            var url = "http://stackoverflow.com/";
            
            general.isUrl(url).should.be.true;
        });
    });
});
