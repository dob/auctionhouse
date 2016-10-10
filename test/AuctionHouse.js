var log = console.log;
var balance = web3.eth.getBalance;

contract("AuctionHouse", function(accounts) {
    it("should know if a seller owns an asset on an external contract", function() {
	var sn = SampleName.deployed();
	var owner = accounts[0];
	var recordId = "test.name";

	// Create a samplename record
	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(res) {
	    return AuctionHouse.new().then(function(ah) {
		return ah.partyOwnsAsset.call(owner, sn.address, recordId).then(function(res) {
		    assert.strictEqual(res, true, "the owner doesn't own this asset");
		}).then(function(res) {
		    return ah.partyOwnsAsset.call(accounts[1], sn.address, recordId).then(function(res) {
			assert.strictEqual(res, false, "the owner owns this asset, but shouldn't.");
		    });
		});
	    });
	});
    });


    it("should let us construct a valid auction", function() {
	var sn = SampleName.deployed();
	var owner = accounts[0];
	var recordId = "test2.name";
	var targetAuctionId = 0;

	// Start by creating a sample record
	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
	    return AuctionHouse.new().then(function(ah) {
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
    });
	
    it("should activate and cancel an auction", function() {
	var sn = SampleName.deployed();
	var owner = accounts[1];
	var recordId = "test3.name";
	var auctionId;

	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
	    return AuctionHouse.new().then(function(ah) {
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
    });
	    
    it("should place a valid bid", function() {
	var sn = SampleName.deployed();
	var owner = accounts[4];
	var recordId = "test4.name";
	var bidder = accounts[5];
	var bidAmount = web3.toWei(0.4, "ether");
	var contractStartBalance;
	var auctionId;

	// Create an asset,
	// create an auction,
	// transfer the asset to the auction
	// activate the auction
	// place a bid
	// check that the bid properties and auction current bid updated

	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
	    return AuctionHouse.new().then(function(ah) {
		contractStartBalance = web3.eth.getBalance(ah.address);
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
				     return ah.placeBid(auctionId, {from:bidder, value:bidAmount});
				 }).then(function() {
			    	     return ah.getBidCountForAuction.call(auctionId);
				 }).then(function(bidCount){
				     assert.strictEqual(bidCount.toNumber(), 1, "there should be one bid");
				     return ah.getBidForAuctionByIdx.call(auctionId, bidCount - 1);
				 }).then(function(bids) {
				     assert.strictEqual(bids[0], bidder, "bidder was not correct");
				     assert.equal(bids[1].toNumber(), bidAmount, "bid amount was not correct");
				     assert.equal(web3.eth.getBalance(ah.address).toNumber(), contractStartBalance + bidAmount, "Contract balance did not equal the bid amount");
				     return ah.getAuction.call(auctionId);
				 }).then(function(auction) {
				     assert.equal(auction[10].toNumber(), bidAmount, "current bid was not equal to the newly bid amount");
				 });
	    });
	});
    });

    it("should return ETH and update balances correctly on subsequent bids", function() {
	var sn = SampleName.deployed();
	var owner = accounts[6];
	var recordId = "highlycontesteditem.name";

	var firstBidder = accounts[7];
	var firstBidderStartBalance = web3.eth.getBalance(firstBidder);
	var firstBidAmount = web3.toWei(0.4, "ether");
	var firstBidderBalanceAfterBid;
	
	var secondBidder = accounts[8];
	var secondBidderStartBalance = web3.eth.getBalance(secondBidder);
	var secondBidAmount = web3.toWei(0.5, "ether");

	var contractStartBalance;

	var auctionId;

	// Create an asset,
	// create an auction,
	// transfer the asset to the auction
	// activate the auction
	// place a bid
	// check that the bid properties and auction current bid updated

	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
	    return AuctionHouse.new().then(function(ah) {
		contractStartBalance = web3.eth.getBalance(ah.address);
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
				     // Place first bid
				     return ah.placeBid(auctionId, {from:firstBidder, value:firstBidAmount});
				 }).then(function() {
				     return ah.getBidForAuctionByIdx.call(auctionId, 0);
				 }).then(function(firstBid) {
				     var newBalance = web3.eth.getBalance(ah.address).toNumber();
				     assert.equal(web3.eth.getBalance(ah.address).toNumber(), contractStartBalance + firstBidAmount, "Contract balance did not equal the bid amount after first bid");
				     // Can never seem to check the actual user balance because of gas charges probably.
				     //assert.equal(web3.eth.getBalance(firstBidder).toNumber(), firstBidderStartBalance - firstBidAmount, "First bidder end balance wasn't updated");
				     firstBidderBalanceAfterBid = web3.eth.getBalance(firstBidder).toNumber();
				     return ah.getAuction.call(auctionId);
				 }).then(function(auction) {
				     assert.equal(auction[10].toNumber(), firstBidAmount, "current bid was not equal to the newly bid amount");

				     // Place bad second bid
				     return ah.placeBid(auctionId, {from: secondBidder, value: firstBidAmount - 10});
				 }).then(function() {
				     // Couldn't check the second bidders balance because of gas costs? Instead check that contract balance didn't change
				     //assert.equal(web3.eth.getBalance(secondBidder).toNumber(), secondBidderStartBalance.toNumber(), "Second bidders balance should not be affected because the bid was too low");
				     assert.equal(web3.eth.getBalance(ah.address).toNumber(), contractStartBalance + firstBidAmount, "Contract balance did not update despite second bid attempt");
				     
				     // Place good second bid
				     return ah.placeBid(auctionId, {from: secondBidder, value: secondBidAmount});
				 }).then(function() {
				     return ah.getBidForAuctionByIdx.call(auctionId, 1);
				 }).then(function(secondBid) {
				     assert.equal(web3.eth.getBalance(ah.address).toNumber(), contractStartBalance + secondBidAmount, "Contract balance did not equal the bid amount after second bid");
				     // Can't check the second bidders balance, so instead make sure the first balance went up after returning his outbid amount
				     //assert.equal(web3.eth.getBalance(secondBidder), secondBidderStartBalance - secondBidAmount, "Second bidder end balance wasn't updated");
				     assert.isAbove(web3.eth.getBalance(firstBidder).toNumber(), firstBidderBalanceAfterBid, "First bidder balance should have been returned upon being outbid");
				     
				     return ah.getAuction.call(auctionId);
				 }).then(function(auction) {
				     assert.equal(auction[10].toNumber(), secondBidAmount, "current bid was not equal to the newly bid amount");
				 });
	    });
	});
    });


    it("should end an auction that met reserve correctly", function() {
	var sn = SampleName.deployed();
	var owner = accounts[5];
	var recordId = "testValidAuction.name";
	var bidder = accounts[6];
	var marketer = accounts[7];
	var marketerCut = 10; // percent
	var bidAmount = web3.toWei(2, "ether");
	var reserveAmount = web3.toWei(0.3, "ether");
	var auctionId;
	var sellerBalanceAfterBid, contractBalanceAfterBid, bidderBalanceAfterBid, marketerBalanceAfterBid;
	var sellerBalanceAfterClose, contractBalanceAfterClose, bidderBalanceAfterClose, marketerBalanceAfterClose;

	sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
	    return AuctionHouse.new().then(function(ah) {
		log("ABOUT TO CREATE AUCTION " + web3.eth.blockNumber);
		ah.createAuction("Title",
				 "Description",
				 sn.address,
				 recordId,
				 web3.eth.blockNumber + 15,
				 10,
				 reserveAmount,
				 marketerCut,
				 marketer, {from:owner}).then(function(txId) {
				     log("AUCTION CREATED " + web3.eth.blockNumber);
			    	     return ah.getAuctionsCountForUser.call(owner);
				 }).then(function(auctionsCount) {
			    	     return ah.getAuctionIdForUserAndIdx.call(owner, auctionsCount - 1);
				 }).then(function(aucId) {
			    	     auctionId = aucId;
			    	     return sn.setOwner(recordId, ah.address, {from:owner});
				 }).then(function() {
			    	     return ah.activateAuction(auctionId, {from:owner});
				 }).then(function(res) {
				     log("AUCTION ACTIVATED " + web3.eth.blockNumber);
				     return ah.placeBid(auctionId, {from:bidder, value:bidAmount});
				 }).then(function() {
				     // Skip 100 blocks
				     /*var i = 0;
				     for (i = 0; i < 100; i++ ) {
					 ah.getStatus(auctionId);
				     }*/
				     return ah.getStatus(auctionId);
				 }).then(function() {
				     log("CHECKING BALANCES " + web3.eth.blockNumber);
				     sellerBalanceAfterBid = balance(owner);
				     contractBalanceAfterBid = balance(ah.address);
				     bidderBalanceAfterBid = balance(bidder);
				     marketerBalanceAfterBid = balance(marketer);
				     return ah.endAuction(auctionId);
				 }).then(function(){
				     log("AUCTION OVER " + web3.eth.blockNumber);
				     sellerBalanceAfterClose = balance(owner);
				     contractBalanceAfterClose = balance(ah.address);
				     bidderBalanceAfterClose = balance(bidder);
				     marketerBalanceAfterClose = balance(marketer);

				     assert.isAbove(sellerBalanceAfterClose.toNumber(), sellerBalanceAfterBid.toNumber(), "Seller balance should have gone up");
				     assert.isBelow(contractBalanceAfterClose.toNumber(), contractBalanceAfterBid.toNumber(), "Contract balance should have gone down");
				     assert.equal(bidderBalanceAfterBid.toNumber(), bidderBalanceAfterClose.toNumber(), "Bidder balance should stay the same");
				     assert.isAbove(marketerBalanceAfterClose.toNumber(), marketerBalanceAfterBid.toNumber(), "Marketer balance should have gone up");

				     log("PASSED ALL ASSERTIONS");
				     return sn.owner.call(recordId);
				 }).then(function(itemOwner) {
				     log("MAKING SURE THAT THE ITEM IS OWNED CORRECTLY.");
				     assert.equal(itemOwner, bidder, "Bidder should be the new owner");
				     return ah.getStatus.call(auctionId);
				 }).then(function(status) {
				     assert.equal(status.toNumber(), 2, "auction should be inactive");
				 });
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
		    throw e;
		}
	    });
    };
});
