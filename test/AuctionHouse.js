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

	it("should activate an auction", function() {
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
			    	assert.strictEqual(auctionStatus.toNumber(), 0, "Auction status should be inactive");
			    	return sn.setOwner(recordId, ah.address, {from:owner});
			    }).then(function() {
			    	return ah.activateAuction(auctionId, {from:owner});
			    }).then(function(res) {
			    	return ah.getStatus.call(auctionId);
			    }).then(function(newAuctionStatus) {
			    	assert.strictEqual(newAuctionStatus.toNumber(), 1, "Auction should be active");
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


    // Here's an example of catching a throw and validating that the throw occurred.
    // It seems to work independently, but screws up the test suite if I'm running the suite
    // and other tests execute after this one?
    // it("should fail if throwtest doesn't throw", function() {
    // 	var ah = AuctionHouse.deployed();
    // 	var reachedStatementDespiteThrow = false;
    // 	return expectedExceptionPromise(function() {
    // 	    return ah.throwTest().then(function() {
    // 		reachedStatementDespiteThrow = true;
    // 	    });
    // 	}, 300000000).then(function() {
    // 	    assert.strictEqual(reachedStatementDespiteThrow, false, "shouldn't be here because the above function should throw");
    // 	});
    // });

    // // This is an attempt at trying to catch a throw on a bad auction creation, but it's not working
    // it("should fail on creation of a bad auction", function() {
    // 	var reachedStatementDespiteThrow = false;
    // 	return expectedExceptionPromise(function() {
    // 	    return createBadAuction().then(function() {
    // 		reachedStatementDespiteThrow = true;
    // 	    });
    // 	}, 300000000).then(function() {
    // 	    assert.strictEqual(reachedStatementDespiteThrow, false, "shouldn't be here because the above function should throw");
    // 	});
    // });

    // function createBadAuction() {
    // 	var sn = SampleName.deployed();
    // 	var ah = AuctionHouse.deployed();
    // 	var owner = accounts[7];
    // 	var recordId = "test7.name";

    // 	// Start by creating a sample record
    // 	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
    // 	    // Now create an auction
    // 	    return ah.createAuction("Title",
    // 				    "Description",
    // 				    sn.address,
    // 				    recordId,
    // 				    web3.eth.blockNumber - 11,
    // 				    (2 * 10^6),
    // 				    (3 * 10^6),
    // 				    5,
    // 				    accounts[2], {from:owner});
    // 	});
    // }

    var expectedExceptionPromise = function (action, gasToUse) {
	return new Promise(function (resolve, reject) {
	    try {
		resolve(action());
	    } catch(e) {
		reject(e);
	    }
	})
	    .then(function (txn) {
		// https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
		return web3.eth.getTransactionReceiptMined(txn);
	    })
	    .then(function (receipt) {
		// We are in Geth
		assert.equal(receipt.gasUsed, gasToUse, "should have used all the gas");
	    })
	    .catch(function (e) {
		if ((e + "").indexOf("invalid JUMP") || (e + "").indexOf("out of gas") > -1) {
		    // We are in TestRPC
		} else if ((e + "").indexOf("please check your gas amount") > -1) {
		    // We are in Geth for a deployment
		} else {
		    console.log("About to throw");
		    throw e;
		}
	    });
    };
});
