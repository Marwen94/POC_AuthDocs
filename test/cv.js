var Cv = artifacts.require("./Cv.sol");

contract("Cv", function(accounts) {
  var cvInstance;

  it("add compet et match", function() {
    return Pari.deployed().then(function(instance) {
      cvInstance = instance;
      return cvInstance.createCompetition("Rugby", "Top 14");
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
			assert.equal(receipt.logs[0].event, "newCompetition", "the event type is correct");
			return cvInstance.createMatch("Stade Toulousain", "Clermont", 0);
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
			assert.equal(receipt.logs[0].event, "newMatch", "the event type is correct");
			return cvInstance.getMatchCount();
    }).then(function(count) {
			assert.equal(count, 1);
			cvInstance.createMatch("La Rochelle", "Castres", 0);
    }).then(function(receipt) {
			return cvInstance.getMatchCount();
    }).then(function(count) {
			assert.equal(count, 2);
			return cvInstance.getMatchByCompetition(0,0);
    }).then(function(m) {
			assert.equal(m[0], "Stade Toulousain");
			assert.equal(m[1], "Clermont");
			return cvInstance.getMatchByCompetition(0,1);
    }).then(function(m) {
			assert.equal(m[0], "La Rochelle");
			assert.equal(m[1], "Castres");
		})
  });
  
  
});