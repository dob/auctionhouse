contract("AuctionHouse", function(accounts) {
    it("should know if a seller owns an asset on an external contract", function() {
	var sn = SampleName.deployed();
	var ah = AuctionHouse.deployed();
	var owner = accounts[0];
	var recordId = "test.name";

	// Create a samplename record
	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(res) {
	    return ah.sellerOwnsAsset.call(owner, sn.address, recordId).then(function(res) {
		assert.strictEqual(res, true, "the owner doesn't own this asset");
	    });
	}).then(function(res) {
	    return ah.sellerOwnsAsset.call(accounts[1], sn.address, recordId).then(function(res) {
		assert.strictEqual(res, false, "the owner owns this asset, but shouldn't.");
	    });
	});
    });


    it("should let us construct a valid auction", function() {
	var sn = SampleName.deployed();
	var ah = AuctionHouse.deployed();
	var owner = accounts[0];
	var recordId = "test2.name";

	// Start by creating a sample record
	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
	    // Now create an auction
	    return ah.createAuction("Title",
				    "Description",
				    sn.address,
				    recordId,
				    web3.eth.blockNumber + 100,
				    (2 * 10^6),
				    (3 * 10^6),
				    5,
				    accounts[2]).then(function(txId) {
					return ah.getAuction.call(0).then(function(auction) {
					    assert.strictEqual(auction[3], "Title", "Didn't get an updated auction");
					    assert.strictEqual(auction[10].toNumber(), 0, "Didn't get an updated auction bid price");
					});
				    });
	});
    });
});
