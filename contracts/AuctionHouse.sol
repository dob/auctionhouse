// This is the main contract that governs execution of auctions
// of non-fungible on-chain assets. Any user can initiate an auction
// for an item that conforms to the Asset interface described in
// Asset.sol

import "Asset.sol";

contract AuctionHouse {

    struct Bid {
	address bidder;
	uint256 amount;
	uint timestamp;
    }

    enum AuctionStatus {Pending, Active, Inactive}

    struct Auction {
	// Location and ownership information of the item for sale
	address seller;
	address contractAddress; // Contract where the item exists
	string recordId;         // RecordID within the contract as per the Asset interface

	// Auction metadata
	string title;
	string description;      // Optionally markdown formatted?
	uint blockNumberOfDeadline;
	AuctionStatus status;

	// Distribution bonus
	uint distributionCut;    // In percent, ie 10 is a 10% cut to the distribution address
	address distributionAddress; 

	// Pricing
	uint256 startingPrice;   // In wei
	uint256 reservePrice;
	uint256 currentBid;

	Bid[] bids;
    }

    Auction[] public auctions;          // All auctions
    mapping(address => uint[]) public auctionsRunByUser; // Pointer to auctions index for auctions run by this user

    mapping(address => uint[]) public auctionsBidOnByUser; // Pointer to auctions index for auctions this user has bid on

    address owner;

    // Events
    event AuctionCreated(uint id, string title, uint256 startingPrice, uint256 reservePrice);
    event AuctionActivated(uint id);
    event AuctionCancelled(uint id);
    event BidPlaced(uint auctionId, address bidder, uint256 amount);
    event AuctionEndedWithWinner(uint auctionId, address winningBidder, uint256 amount);
    event AuctionEndedWithoutWinner(uint auctionId, uint256 topBid, uint256 reservePrice);

    event LogFailure(string message);

    modifier onlyOwner {
	if (owner != msg.sender) throw;
	_
    }

    modifier onlySeller(uint auctionId) {
	if (auctions[auctionId].seller != msg.sender) throw;
	_
    }

    modifier onlyLive(uint auctionId) {
	Auction a = auctions[auctionId];
	if (a.status != AuctionStatus.Active) {
	    throw;
	}

	// Auction should not be over
	if (block.number >= a.blockNumberOfDeadline) {
	    throw;
	}
	_
    }
    
    function AuctionHouse() {
	owner = msg.sender;
    }

    // This is a convenience function for development, testing debugging
    // and catching throws in the tests. Can remove after getting the
    // pattern down.
    function throwTest() {
	throw;
    }
    
    // Create an auction, transfer the item to this contract, activate the auction
    function createAuction(
	string _title,
	string _description,
	address _contractAddressOfAsset,
	string _recordIdOfAsset,
	uint _deadline,   // in blocknumber
	uint256 _startingPrice,
	uint256 _reservePrice,
	uint _distributionCut,
	address _distributionCutAddress) returns (uint auctionId) {

	    // Check to see if the seller owns the asset at the contract
	    if (!partyOwnsAsset(msg.sender, _contractAddressOfAsset, _recordIdOfAsset)) {
		throw;
	    }

	    // Check to see if the auction deadline is in the future
	    if (block.number >= _deadline) {
		throw;
	    }

	    // Price validations
	    if (_startingPrice < 0 || _reservePrice < 0) {
		throw;
	    }

	    // Distribution validations
	    if (_distributionCut < 0 || _distributionCut > 100) {
		throw;
	    }

	    auctionId = auctions.length++;
	    Auction a = auctions[auctionId];
	    a.seller = msg.sender;
	    a.contractAddress = _contractAddressOfAsset;
	    a.recordId = _recordIdOfAsset;
	    a.title = _title;
	    a.description = _description;
	    a.blockNumberOfDeadline = _deadline;
	    a.status = AuctionStatus.Pending;
	    a.distributionCut = _distributionCut;
	    a.distributionAddress = _distributionCutAddress;
	    a.startingPrice = _startingPrice;
	    a.reservePrice = _reservePrice;
	    a.currentBid = 0;

            auctionsRunByUser[a.seller].push(auctionId);
	    AuctionCreated(auctionId, a.title, a.startingPrice, a.reservePrice);

	    return auctionId;
	}

    function partyOwnsAsset(address _party, address _contract, string _recordId) returns (bool success) {
	Asset assetContract = Asset(_contract);
	return assetContract.owner(_recordId) == _party;
    }

    /**
     * The auction fields are indexed in the return val as follows
     * [0]  -> Auction.seller
     * [1]  -> Auction.contractAddress
     * [2]  -> Auction.recordId
     * [3]  -> Auction.title
     * [4]  -> Auction.description
     * [5]  -> Auction.blockNumberOfDeadline
     * [6]  -> Auction.distributionCut
     * [7]  -> Auction.distributionAddress
     * [8]  -> Auction.startingPrice
     * [9] -> Auction.reservePrice
     * [10] -> Auction.currentBid
     * [11] -> Auction.bids.length      
     * []  -> Auction.status (Not included right now)
     */
    function getAuction(uint idx) returns (address, address, string, string, string, uint, uint, address, uint256, uint256, uint256, uint) {
	Auction a = auctions[idx];
	return (a.seller,
		a.contractAddress,
		a.recordId,
		a.title,
		a.description,
		a.blockNumberOfDeadline,
		a.distributionCut,
		a.distributionAddress,
		a.startingPrice,
		a.reservePrice,
		a.currentBid,
		a.bids.length
        );
    }

    function getStatus(uint idx) returns (uint) {
	Auction a = auctions[idx];
	return uint(a.status);
    }

    function getAuctionsCountForUser(address addr) returns (uint) {
        return auctionsRunByUser[addr].length;
    }

    function getAuctionIdForUserAndIdx(address addr, uint idx) returns (uint) {
        return auctionsRunByUser[addr][idx];
    }

    // Checks if this contract address is the owner of the item for the auction
    function activateAuction(uint auctionId) onlySeller(auctionId) returns (bool){
        Auction a = auctions[auctionId];

        if (!partyOwnsAsset(this, a.contractAddress, a.recordId)) throw;

        a.status = AuctionStatus.Active;
	AuctionActivated(auctionId);
        return true;
    }

    function cancelAuction(uint auctionId) onlySeller(auctionId) returns (bool) {
        Auction a = auctions[auctionId];

        if (!partyOwnsAsset(this, a.contractAddress, a.recordId)) throw;

        Asset asset = Asset(a.contractAddress);
        asset.setOwner(a.recordId, a.seller);

	AuctionCancelled(auctionId);
        a.status = AuctionStatus.Inactive;
	return true;
    }

    /* BIDS */
    function getBidCountForAuction(uint auctionId) returns (uint) {
	Auction a = auctions[auctionId];
	return a.bids.length;
    }

    function getBidForAuctionByIdx(uint auctionId, uint idx) returns (address bidder, uint256 amount, uint timestamp) {
	Auction a = auctions[auctionId];
	if(idx > a.bids.length - 1) {
	    throw;
	}
	
	Bid b = a.bids[idx];
	return (b.bidder, b.amount, b.timestamp);
    }

    function placeBid(uint auctionId) onlyLive(auctionId) returns (bool success) {
	uint256 amount = msg.value;
	Auction a = auctions[auctionId];

	if (a.currentBid >= amount) {
	    // Want to return the bid amount and return false
	    if(!msg.sender.send(amount)) {
		LogFailure("Could not return the invalid bid amount to the bidder");
	    }
	    return false;
	}

	uint bidIdx = a.bids.length++;
	Bid b = a.bids[bidIdx];
	b.bidder = msg.sender;
	b.amount = amount;
	b.timestamp = now;
	a.currentBid = amount;

	auctionsBidOnByUser[b.bidder].push(auctionId);

	// Return ETH to previous bidder
	if (bidIdx > 0) {
	    Bid previousBid = a.bids[bidIdx - 1];
	    if (!previousBid.bidder.send(previousBid.amount)) {
		LogFailure("Could not return the outbid amount to the previous bidder");
	    }
	}

	BidPlaced(auctionId, b.bidder, b.amount);
	return true;
    }

    function endAuction(uint auctionId) returns (bool success) {
	// Check if the auction is passed the end date
	Auction a = auctions[auctionId];
	if (block.number < a.blockNumberOfDeadline) {
	    LogFailure("Can not end an auction that hasn't hit the deadline yet");
	    return false;
	}

	// No bids, make the auction inactive
	if (a.bids.length == 0) {
	    a.status = AuctionStatus.Inactive;
	    return true;
	}

	Bid topBid = a.bids[a.bids.length - 1];
	Asset asset = Asset(a.contractAddress);

	// If the auction hit its reserve price
	if (a.currentBid >= a.reservePrice) {
	    uint distributionShare = a.currentBid * a.distributionCut / 100;  // Calculate the distribution cut
	    uint sellerShare = a.currentBid - distributionShare;

	    asset.setOwner(a.recordId, topBid.bidder);  // Set the items new owner
	    
	    if (!a.distributionAddress.send(distributionShare)) { LogFailure("Couldn't send the marketing distribution"); }
	    if (!a.seller.send(sellerShare)) { LogFailure("Couldn't send the seller his cut"); }

	    AuctionEndedWithWinner(auctionId, topBid.bidder, a.currentBid);
	} else {
	    // Return the item to the owner and the money to the top bidder
	    asset.setOwner(a.recordId, a.seller);
	    if (!topBid.bidder.send(a.currentBid)) { LogFailure("Couldn't send the top bidder his money back on a failed to meet reserve scenario."); }

	    AuctionEndedWithoutWinner(auctionId, a.currentBid, a.reservePrice);
	}

	a.status = AuctionStatus.Inactive;
	return true;
    }

    function() {
	// Don't allow ether to be sent blindly to this contract
	throw;
    }
}
