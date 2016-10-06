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
    event BidPlaced(uint auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint auctionId, address winningBidder, uint256 amount);

    modifier onlyOwner {
	if (owner != msg.sender) throw;
	_
    }

    
    /* PLACEHOLDERS FOR IMPLEMENTATION */

    function AuctionHouse() {
	owner = msg.sender;
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
	    if (!sellerOwnsAsset(msg.sender, _contractAddressOfAsset, _recordIdOfAsset)) {
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

	    return auctionId;
	}

    function sellerOwnsAsset(address _seller, address _contract, string _recordId) returns (bool success) {
	Asset assetContract = Asset(_contract);
	return assetContract.owner(_recordId) == _seller;
    }

    /**
     * The auction fields are indexed in the return val as follows
     * [0]  -> Auction.seller
     * [1]  -> Auction.contractAddress
     * [2]  -> Auction.recordId
     * [3]  -> Auction.title
     * [4]  -> Auction.description
     * [5]  -> Auction.blockNumberOfDeadline
     * []  -> Auction.status (Not included right now)
     * [6]  -> Auction.distributionCut
     * [7]  -> Auction.distributionAddress
     * [8]  -> Auction.startingPrice
     * [9] -> Auction.reservePrice
     * [10] -> Auction.currentBid
     * [11] -> Auction.bids.length      
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
		a.bids.length);
    }
    
    
/*    function activateAuction();   // Checks if this contract address is the owner of the item for the auction
    
    function cancelAuction();     // Cancel an auction before it's too late
    function endAuction();        // Anyone can call this to see if the auction is done and transfer the items

    function placeBid();*/
}
