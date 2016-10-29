var log = console.log;
var balance = web3.eth.getBalance;

contract("AuctionHouse", function(accounts) {
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

        var contractStartBalance = 0;

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

                                 //     // Place bad bid cannot be easily tested because it throws.
                                 //     return ah.placeBid(auctionId, {from: secondBidder, value: firstBidAmount - 10});
                                 // }).then(function() {
                                 //     // Couldn't check the second bidders balance because of gas costs? Instead check that contract balance didn't change
                                 //     //assert.equal(web3.eth.getBalance(secondBidder).toNumber(), secondBidderStartBalance.toNumber(), "Second bidders balance should not be affected because the bid was too low");
                                 //     assert.equal(web3.eth.getBalance(ah.address).toNumber(), contractStartBalance + firstBidAmount, "Contract balance did not update despite second bid attempt");
                                     
                                     // Place good second bid
                                     return ah.placeBid(auctionId, {from: secondBidder, value: secondBidAmount});
                                 }).then(function() {
                                     return ah.getBidForAuctionByIdx.call(auctionId, 1);
                                 }).then(function(secondBid) {
                                     assert.equal(web3.eth.getBalance(ah.address).toNumber(), parseInt(contractStartBalance) + parseInt(firstBidAmount) + parseInt(secondBidAmount), "Contract balance did not equal the bid amount after second bid");
                                     // Can't check the second bidders balance, so instead make sure the first balance went up after returning his outbid amount
                                     //assert.equal(web3.eth.getBalance(secondBidder), secondBidderStartBalance - secondBidAmount, "Second bidder end balance wasn't updated");
                                     assert.equal(web3.eth.getBalance(firstBidder).toNumber(), firstBidderBalanceAfterBid, "First bidder balance should be the same (without withdrawing the fund)");

                                     return ah.getRefundValue.call({from: firstBidder});
                                 }).then(function(firstBidderRefundBalance) {
                                    assert.equal(firstBidAmount, firstBidderRefundBalance, "The first bid amount should be withdraw-able");
                                    return ah.withdrawRefund({from: firstBidder});
                                 }).then(function() {
                                    //Can only do 'above' because it costs some gas to do the withdraw, so the number won't add up exactly
                                    assert.isAbove(web3.eth.getBalance(firstBidder).toNumber(), parseInt(firstBidderBalanceAfterBid), "The first bid should be withdrawn");
                                    return ah.getRefundValue.call({from: firstBidder});
                                }).then(function(firstBidderRefundBalance) {
                                    assert.equal(firstBidderRefundBalance, 0, "The first bidder refund balance should be 0 after withdrawing");

                                     return ah.getAuction.call(auctionId);
                                 }).then(function(auction) {
                                     assert.equal(auction[10].toNumber(), secondBidAmount, "current bid was not equal to the newly bid amount");
                                 });
            });
        });
    });

});
