var log = console.log;
var balance = web3.eth.getBalance;

contract("AuctionHouse", function(accounts) {
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
				 web3.eth.blockNumber + 90,
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
				     var i = 0;
				     for (i = 0; i < 100; i++ ) {
					 ah.getStatus(auctionId);
				     }
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

				     assert.isAbove(sellerBalanceAfterClose, sellerBalanceAfterBid, "Seller balance should have gone up");
				     assert.isBelow(contractBalanceAfterClose, contractBalanceAfterBid, "Contract balance should have gone down");
				     assert.equal(bidderBalanceAfterBid.toNumber(), bidderBalanceAfterClose.toNumber(), "Bidder balance should stay the same");
				     assert.isAbove(marketerBalanceAfterClose, marketerBalanceAfterBid, "Marketer balance should have gone up");

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
});
