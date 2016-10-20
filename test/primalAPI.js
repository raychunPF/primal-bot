// Test setup
var testHome = "../test";
require(testHome + "/test-setup");
var primalAPI = require("../primalAPI.js").primalAPI;

// Test packages
var restler = require("restler");
var should = require("chai").should();

describe("Primal Service API", function() {
    describe("Recommendation using a url", function() {
        this.slow(1000);
        var url = "http://stackoverflow.com/";
        
        it("should return 5 content items", function(done) {
            primalAPI.recommendations(url, function(content) {
                content.should.have.lengthOf(5);
                done();
            }, function(error) {
                done(error.details);
            });
        });
    });

    describe("Recommendation using a query", function() {
        var query = "buddy is a dog";
        
        it("should return 5 content items", function() {
            primalAPI.recommendations(query, function(content) {
                content.should.have.lengthOf(5);
                done();
            }, function(error) {
                done(error.details);
            });
        });
    });
});
