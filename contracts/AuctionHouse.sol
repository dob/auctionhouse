// This is the main contract that governs execution of auctions
// of non-fungible on-chain assets. Any user can initiate an auction
// for an item that conforms to the Asset interface described in
// Asset.sol

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
	uint blockNumberOfDeadline;
	AuctionStatus status;

	// Distribution bonus
	uint distributionCut;    // In percent, ie 10 is a 10% cut to the distribution address
	address distributionAddress; 

	uint256 startingPrice;   // In wei
	uint256 reservePrice;
	uint256 currentBid;

	Bid[] bids;
    }

    Auction[] pendingAuctions;
    Auction[] activeAuctions;
    Auction[] inactiveAuctions;

    /* PLACEHOLDERS FOR IMPLEMENTATION */
    
    // Create an auction, transfer the item to this contract, activate the auction
    function createAuction();
    function activateAuction();   // Checks if this contract address is the owner of the item for the auction
    
    function cancelAuction();     // Cancel an auction before it's too late
    function endAuction();        // Anyone can call this to see if the auction is done and transfer the items

    function placeBid();
}
