contract("AuctionHouse", function(accounts) {
    it("should know if a seller owns an asset on an external contract", function() {
	var sn = SampleName.deployed();
	var ah = AuctionHouse.deployed();
	var owner = accounts[0];
	var recordId = "test.name";

	// Create a samplename record
	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(res) {
	    return ah.partyOwnsAsset.call(owner, sn.address, recordId).then(function(res) {
		assert.strictEqual(res, true, "the owner doesn't own this asset");
	    });
	}).then(function(res) {
	    return ah.partyOwnsAsset.call(accounts[1], sn.address, recordId).then(function(res) {
		assert.strictEqual(res, false, "the owner owns this asset, but shouldn't.");
	    });
	});
    });


    it("should let us construct a valid auction", function() {
	var sn = SampleName.deployed();
	var ah = AuctionHouse.deployed();
	var owner = accounts[0];
	var recordId = "test2.name";
	var targetAuctionId = 0;

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
				    accounts[2], {from:owner}).then(function(txId) {

					return ah.getAuction.call(targetAuctionId).then(function(auction) {
					    assert.strictEqual(auction[0], owner, "Didn't get the correct seller");
					    assert.strictEqual(auction[3], "Title", "Didn't get an updated auction");
					    assert.strictEqual(auction[10].toNumber(), 0, "Didn't get an updated auction bid price");
					    return ah.getAuctionsCountForUser.call(owner);
					}).then(function(auctionsCount) {
					 	assert.strictEqual(auctionsCount.toNumber(), 1, "Should only have 1 auction");
					 	return ah.getAuctionIdForUserAndIdx.call(owner, auctionsCount.toNumber() - 1);
					}).then(function(auctionId) {
					 	assert.strictEqual(auctionId.toNumber(), targetAuctionId, "AuctionId should be zero");
					});

				    });
	});
    });

	it("should activate and cancel an auction", function() {
		var sn = SampleName.deployed();
		var ah = AuctionHouse.deployed();
		var owner = accounts[1];
		var recordId = "test3.name";
		var auctionId;

		sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
			ah.createAuction("Title",
				"Description",
				sn.address,
				recordId,
			    web3.eth.blockNumber + 100,
			    (2 * 10^6),
			    (3 * 10^6),
			    5,
			    accounts[2], {from:owner}).then(function(txId) {
			    	return ah.getAuctionsCountForUser.call(owner);
			    }).then(function(auctionsCount) {
			    	return ah.getAuctionIdForUserAndIdx.call(owner, auctionsCount - 1);
			    }).then(function(aucId) {
			    	auctionId = aucId;
			    	return ah.getStatus.call(auctionId);
			    }).then(function(auctionStatus) {
			    	assert.strictEqual(auctionStatus.toNumber(), 0, "Auction status should be pending");
			    	return sn.setOwner(recordId, ah.address, {from:owner});
			    }).then(function() {
			    	return ah.activateAuction(auctionId, {from:owner});
			    }).then(function(res) {
			    	return ah.getStatus.call(auctionId);
			    }).then(function(activeAuctionStatus) {
			    	assert.strictEqual(activeAuctionStatus.toNumber(), 1, "Auction should be active");
			    	return ah.cancelAuction(auctionId, {from:owner});
			    }).then(function(res) {
			    	return ah.getStatus.call(auctionId);
			    }).then(function(cancelledAuctionStatus) {
			    	assert.strictEqual(cancelledAuctionStatus.toNumber(), 2, "Auction should be inactive");
			    	return sn.owner.call(recordId);
			    }).then(function(assetOwner) {
			    	assert.strictEqual(assetOwner, owner, "Should return the asset to the seller");
			    });
		});
	});

    it("should place a valid bid", function() {
	var sn = SampleName.deployed();
	var ah = AuctionHouse.deployed();
	var owner = accounts[4];
	var recordId = "test4.name";
	var bidder = accounts[5];
	var bidAmount = (4 * 10^6);
	var auctionId;

	// Create an asset,
	// create an auction,
	// transfer the asset to the auction
	// activate the auction
	// place a bid
	// check that the bid properties and auction current bid updated

	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
	    ah.createAuction("Title",
			     "Description",
			     sn.address,
			     recordId,
			     web3.eth.blockNumber + 100,
			     (2 * 10^6),
			     (3 * 10^6),
			     5,
			     accounts[2], {from:owner}).then(function(txId) {
			    	 return ah.getAuctionsCountForUser.call(owner);
			     }).then(function(auctionsCount) {
			    	 return ah.getAuctionIdForUserAndIdx.call(owner, auctionsCount - 1);
			     }).then(function(aucId) {
			    	 auctionId = aucId;
			    	 return sn.setOwner(recordId, ah.address, {from:owner});
			     }).then(function() {
			    	 return ah.activateAuction(auctionId, {from:owner});
			     }).then(function(res) {
				 return ah.placeBid(auctionId, bidAmount, {from:bidder});
			     }).then(function() {
			    	 return ah.getBidCountForAuction.call(auctionId);
			     }).then(function(bidCount){
				 assert.strictEqual(bidCount.toNumber(), 1, "there should be one bid");
				 return ah.getBidForAuctionByIdx.call(auctionId, bidCount - 1);
			     }).then(function(bids) {
				 assert.strictEqual(bids[0], bidder, "bidder was not correct");
				 assert.strictEqual(bids[1].toNumber(), bidAmount, "bid amount was not correct");
				 return ah.getAuction.call(auctionId);
			     }).then(function(auction) {
				 assert.strictEqual(auction[10].toNumber(), bidAmount, "current bid was not equal to the newly bid amount");
			     });
	});
    });

    it("should cancel an auction", function() {
		var sn = SampleName.deployed();
		var ah = AuctionHouse.deployed();
		var owner = accounts[6];
		var recordId = "test5.name";
		var bidder = accounts[7];
		var bidAmount = (4 * 10^6);
		var auctionId;

		// Create an asset,
		// create an auction,
		// transfer the asset to the auction
		// activate the auction
		// place a bid
		// check that the bid properties and auction current bid updated

		sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
		    ah.createAuction("Title",
				    "Description",
				    sn.address,
				    recordId,
				    web3.eth.blockNumber + 100,
				    (2 * 10^6),
				    (3 * 10^6),
				    5,
				    accounts[2], {from:owner}).then(function(txId) {
				    	return ah.getAuctionsCountForUser.call(owner);
				    }).then(function(auctionsCount) {
				    	return ah.getAuctionIdForUserAndIdx.call(owner, auctionsCount - 1);
				    }).then(function(aucId) {
			    		auctionId = aucId;
				     	return ah.getStatus.call(auctionId);
				    }).then(function(status) {
				    	assert.strictEqual(status.toNumber(), 0, "Should be active");
				    });
		});
	});

 //    it("should fail when creating an invalid auction", function(done) {
	// var sn = SampleName.deployed();
	// var ah = AuctionHouse.deployed();
	// var owner = accounts[0];
	// var recordId = "test3.name";

	// // Start by creating a sample record
	// sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
	//     // Now create an auction
	//     return ah.createAuction("Title",
	// 			    "Description",
	// 			    sn.address,
	// 			    recordId,
	// 			    web3.eth.blockNumber - 1,
	// 			    (2 * 10^6),
	// 			    (3 * 10^6),
	// 			    5,
	// 			    accounts[2]).then(function(txId) {

	// 				return ah.getAuction.call(0).then(function(auction) {
	// 				    assert.strictEqual(true, false, "Shouldn't get here");
	// 				});
	// 			    });
	// }).catch(done);
 //    });
});
