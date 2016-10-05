contract("SampleName", function(accounts) {
    it("should create a new name record and set the owner", function() {
	var sn = SampleName.deployed();
	var recordId = "doug.wallet";
	var eventualOwner;

	// Note that we execute addName directly instead of calling call().
	// This is because .call() will execute a read only call instead of
	// a transaction, modifying state, which is what addName requires	
	
	return sn.addName(recordId, accounts[0], "doug.wallet", accounts[0]).then(function(res) {
	    return sn.owner.call(recordId);
	}).then(function(result) {
	    eventualOwner = result;
	    assert.strictEqual(eventualOwner, accounts[0], "Owner not being set correctly");
	});
    });
});
