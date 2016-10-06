contract("AuctionHouse", function(accounts) {
    it("should know if a seller owns an asset on an external contract", function() {
	var sn = SampleName.deployed();
	var ah = AuctionHouse.deployed();
	var owner = accounts[0];
	var recordId = "test.name";

	// Create a samplename record
	return sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(res) {
	    return ah.sellerOwnsAsset.call(owner, sn.address, recordId).then(function(res) {
		assert.strictEqual(res, true, "the owner doesn't own this asset");
	    });
	}).then(function(res) {
	    return ah.sellerOwnsAsset.call(accounts[1], sn.address, recordId).then(function(res) {
		assert.strictEqual(res, false, "the owner owns this asset, but shouldn't.");
	    });
	});
    });
});
