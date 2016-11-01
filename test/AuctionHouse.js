var log = console.log;
var balance = web3.eth.getBalance;

function createRecord(sn, owner, recordId, fromAddr, callback) {
    sn.addRecord(recordId, owner, recordId, owner, {from:fromAddr}).then(function(res) {
        callback();
    });
}

function createAuction(recordId, 
                       title, 
                       desc, 
                       contractAddrOfAsset, 
                       deadline,
                       startingPrice,
                       reservePrice,
                       distributionCut,
                       distributorAddr,
                       fromAddr,
                       callback) {
    // sn.addRecord(recordId, owner, recordId, owner, {from: owner}).then(function(res) {
    return AuctionHouse.new().then(function(ah) {
        return ah.createAuction(title,
                                desc,
                                contractAddrOfAsset,
                                recordId,
                                deadline,
                                startingPrice,
                                reservePrice,
                                distributionCut,
                                distributorAddr, {from:fromAddr}).then(function(txId) {
                                    callback(ah);
                                });
    });
    // });
}

contract("AuctionHouse", function(accounts) {
    it("should check and see if the asset is already on auction", function() {
        var sn = SampleName.deployed();
        var owner = accounts[9];
        var recordId = "test9.name";
        var title = "title";
        var desc = "desc";
        var contractAddrOfAsset = sn.address;
        var deadline = web3.eth.blockNumber + 100;
        var startingPrice = web3.toWei(0.2, "ether");
        var reservePrice = web3.toWei(0.3, "ether");
        var distributionCut = 5;
        var distributorAddr = accounts[2];

        createRecord(sn, owner, recordId, owner, function() {
            //Create an auction
            createAuction(recordId, 
                          title,
                          desc,
                          contractAddrOfAsset,
                          deadline,
                          startingPrice,
                          reservePrice,
                          distributionCut,
                          distributorAddr,
                          owner,
                          function(ah) {
                              return ah.getAuctionCount.call().then(function(auctionCount) {
                                  assert.strictEqual(auctionCount.toNumber(), 1, "there should be 1 auction created");

                                  //Create another auction with the same record
                                  createAuction(recordId, title, desc, contractAddrOfAsset, deadline, startingPrice, reservePrice, distributionCut, distributorAddr, owner, function(ah) {
                                      return ah.getAuctionCount.call().then(function(auctionCount) {
                                          assert.strictEqual(auctionCount.toNumber(), 1, "there should still be 1 auction created (cannot auction the same asset twice)");
                                      });
                                  });
                              });

                          });
        });
    });

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
        var startingBid = web3.toWei(0.2, "ether");
        var reservePrice = web3.toWei(0.3, "ether");

        // Start by creating a sample record
        sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
            return AuctionHouse.new().then(function(ah) {
                // Now create an auction
                return ah.createAuction("Title",
                                        "Description",
                                        sn.address,
                                        recordId,
                                        web3.eth.blockNumber + 100,
                                        startingBid,
                                        reservePrice,
                                        5,
                                        accounts[2], {from:owner}).then(function(txId) {

                                            return ah.getAuction.call(targetAuctionId).then(function(auction) {
                                                assert.strictEqual(auction[0], owner, "Didn't get the correct seller");
                                                assert.strictEqual(auction[3], "Title", "Didn't set an auction name");
                                                assert.equal(auction[8], startingBid, "Didn't set a starting bid price")
                                                assert.equal(auction[10], startingBid, "Didn't set a current bid price");
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
        var bidder = accounts[2];
        var recordId = "test3.name";
        var bidAmount = web3.toWei(0.25, "ether");

        var auctionId;
        var bidderBalanceBeforeBid;
        var bidderBalanceAfterBid;
        var bidderBalanceAfterCancellation;
        var bidderBalanceAfterWithdraw;

        sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
            return AuctionHouse.new().then(function(ah) {
                ah.createAuction("Title",
                                 "Description",
                                 sn.address,
                                 recordId,
                                 web3.eth.blockNumber + 100,
                                 web3.toWei(0.2, "ether"),
                                 web3.toWei(0.3, "ether"),
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
                                     bidderBalanceBeforeBid = web3.eth.getBalance(bidder).toNumber();
                                     return ah.placeBid(auctionId, {from:bidder, value:bidAmount, gas:500000});
                                 }).then(function(){
                                     bidderBalanceAfterBid = web3.eth.getBalance(bidder).toNumber();
                                     assert.isAbove(bidderBalanceBeforeBid - bidAmount, bidderBalanceAfterBid, "Balance should be (bidAmount + gas) less now");
                                     return ah.cancelAuction(auctionId, {from:owner});
                                 }).then(function(res) {
                                     bidderBalanceAfterCancellation = web3.eth.getBalance(bidder).toNumber();
                                     assert.strictEqual(bidderBalanceAfterBid, bidderBalanceAfterCancellation, "Balance should be the same after cancellation, before withdraw");
                                     return ah.getStatus.call(auctionId);
                                 }).then(function(cancelledAuctionStatus) {
                                     assert.strictEqual(cancelledAuctionStatus.toNumber(), 2, "Auction should be inactive");
                                     return ah.withdrawRefund({from:bidder});
                                 }).then(function() {
                                     bidderBalanceAfterWithdraw = web3.eth.getBalance(bidder).toNumber();
                                     assert.isAbove(bidderBalanceAfterWithdraw, bidderBalanceAfterCancellation, "Balance should be more after withdraw");
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




    // Here's an example of catching a throw and validating that the throw occurred.
    // It seems to work independently, but screws up the test suite if I'm running the suite
    // and other tests execute after this one?
    // it("should fail if throwtest doesn't throw", function() {
    //  var ah = AuctionHouse.deployed();
    //  var reachedStatementDespiteThrow = false;
    //  return expectedExceptionPromise(function() {
    //      return ah.throwTest().then(function() {
    //          reachedStatementDespiteThrow = true;
    //      });
    //  }, 300000000).then(function() {
    //      assert.strictEqual(reachedStatementDespiteThrow, false, "shouldn't be here because the above function should throw");
    //  });
    // });

    // // This is an attempt at trying to catch a throw on a bad auction creation, but it's not working
    // it("should fail on creation of a bad auction", function() {
    //  var reachedStatementDespiteThrow = false;
    //  return expectedExceptionPromise(function() {
    //      return createBadAuction().then(function() {
    //          reachedStatementDespiteThrow = true;
    //      });
    //  }, 300000000).then(function() {
    //      assert.strictEqual(reachedStatementDespiteThrow, false, "shouldn't be here because the above function should throw");
    //  });
    // });

    // function createBadAuction() {
    //  var sn = SampleName.deployed();
    //  var ah = AuctionHouse.deployed();
    //  var owner = accounts[7];
    //  var recordId = "test7.name";

    //  // Start by creating a sample record
    //  sn.addRecord(recordId, owner, recordId, owner, {from:owner}).then(function(txId) {
    //      // Now create an auction
    //      return ah.createAuction("Title",
    //                              "Description",
    //                              sn.address,
    //                              recordId,
    //                              web3.eth.blockNumber - 11,
    //                              (2 * 10^6),
    //                              (3 * 10^6),
    //                              5,
    //                              accounts[2], {from:owner});
    //  });
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
