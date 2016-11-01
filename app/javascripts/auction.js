var accounts;
var account;
var auctions;
var auctionHouseContract;
var sampleNameContract;
var auction;
var currentBlockNumber;

var infoBoxHTMLOwnerPending = "<p>Right now this auction is <b>pending</b>. If you're the owner you can click the activate button, which will initiate two ethereum transactions. The first will transfer ownership of your asset to the <a href='https://github.com/dob/auctionhouse/contracts/AuctionHouse.sol'>AuctionHouse contract</a>. The second will activate the auction.</p><p>Don't worry, if the auction doesn't succeed by the deadline, then ownership of your asset will be transfered back to you.</p>";

var infoBoxHTMLActive = "<p>Right now this auction is <b>active</b>. You can place a bid, in ether, for this item if you are running <a href='http://metamask.io'>Metamask</a>. It will ask you to authorize your bid transaction, and the ether for your bid will be held by the <a href='https://github.com/dob/auctionhouse/contracts/AuctionHouse.sol'>AuctionHouse contract</a> until you either win the item, or until you are out bid. At that point your bid amount will be transfered back to you or your won item will be transfered to you by the contract.</p>";

var infoBoxHTMLInactive = "<p>Right now this auction is either over, or was cancelled. You can not place a bid on this item at this point. Try browsing the other <a href='index.html#auctions'>currently active auctions</a>.</p>";


function refreshAuction() {
    var auctionId = getParameterByName("auctionId");
    auction = {"auctionId": auctionId};

    auctionHouseContract.getAuctionCount.call().then(function(auctionCount) {
	// console.log(auctionCount.toNumber());
	if (auctionCount.toNumber() < auctionId) {
            setStatus("Cannot find auction: " + auctionId, "error");
            throw new Error();
            //Redirect to 404 page
	}
    });

    auctionHouseContract.getStatus.call(auctionId).then(function(auctionStatus) {
	// console.log("status:" + auctionStatus);
	if (auctionStatus == 0) {
            auction["status"] = "Pending";
	    updateInfoBox(infoBoxHTMLOwnerPending);
	} else if (auctionStatus == 1) {
            auction["status"] = "Active";
	    updateInfoBox(infoBoxHTMLActive);
	} else if (auctionStatus == 2) {
            auction["status"] = "Inactive";
  	    updateInfoBox(infoBoxHTMLInactive);
	} else {
            alert("Unknown status: " + auctionStatus);
	}

	auctionHouseContract.getAuction.call(auctionId).then(function(result) {
            auction["seller"] = result[0];
            auction["contractAddress"] = result[1];
            auction["recordId"] = result[2];
            auction["title"] = result[3];
            auction["description"] = result[4];
            auction["blockNumberOfDeadline"] = result[5].toNumber();
            auction["distributionCut"] = result[6].toNumber();
            auction["distributionAddress"] = result[7]
            auction["startingPrice"] = result[8].toNumber();
            auction["reservePrice"] = result[9].toNumber();
            auction["currentBid"] = result[10].toNumber();
            auction["bidCount"] = result[11].toNumber();

            var container = document.getElementById("auction_container");
            container.innerHTML = constructAuctionView(auction);
      });

    });
}

function activateAuction() {
    if (!isOwner()) {
	setStatus("Only seller can activate auction.", "error");
    }

    //Transfer ownership to the contract
    // var sn = SampleName.deployed();
    console.log(auction["recordId"]);
    console.log(auctionHouseContract.address);

    setStatus("Transfering ownership to the contract...", "warning");
    showSpinner();

    var assetContract = Asset.at(auction["contractAddress"]);

    assetContract.owner.call(auction["recordId"]).then(function(ownerAddress) {
	if (ownerAddress != auctionHouseContract.address) {
	    // Asset not owned by contract. First set its owner to this contract
	    assetContract.setOwner(auction["recordId"], auctionHouseContract.address, {from: account, gas: 500000}).then(function(txnId) {
		console.log("set owner transaction: " + txnId);
		setStatus("Ownership transfer complete!");
		hideSpinner();

		performActivation();
	    });
	} else {
	    // Asset is already owned by the contract
	    performActivation();
	}
    });
}

function performActivation() {
    //Activate the auction
    setStatus("Activating auction...", "warning");
    showSpinner();
    auctionHouseContract.activateAuction(auction["auctionId"], {from: account, gas: 500000}).then(function(txnId) {
	console.log("activate auction txnId" + txnId);
	setStatus("Auction activated!");
	hideSpinner();
	refreshAuction();
    });
}

function placeBid() {
    var bid = document.getElementById("bid_value").value;
    bid = web3.toWei(bid, "ether");

    setStatus("Bid is being placed, hang tight...", "warning");
    showSpinner();

    if (bid < auction["currentBid"]) {
	setStatus("Bid has to be at least " + auction["currentBid"], "error");
	return;
    }

    var gas = 1400000;
    auctionHouseContract.placeBid(auction["auctionId"], {from:account, value:bid, gas: gas}).then(function(txnId) {
	console.log("Bid txnId: " + txnId);
	web3.eth.getTransactionReceipt(txnId, function(err, txnReceipt) {
	    if (txnReceipt.gasUsed == gas) {
		console.log("We had a failed bid " + txnReceipt);
		setStatus("Bid failed", "error");
		hideSpinner();
	    } else {
		console.log("We had a successful bid " + txnReceipt);
		setStatus("Bid succeeded!", "success");
		hideSpinner();
	    }
	});
	refreshAuction();
    });
}

function endAuction() {
    setStatus("Ending auction...", "warning");
  showSpinner();
  auctionHouseContract.endAuction(auction["auctionId"], {from:account, gas: 1400000}).then(function(txnId) {
    console.log("End auction txnId: " + txnId)
    setStatus("Auction ended successfully.");
    hideSpinner();
    refreshAuction();
  });
}

function isOwner() {
  return auction["seller"] == account;
}

function constructAuctionView(auction) {
    $("#auctionTitle").text(auction["title"]);
    
    result = "<table class='auctionDetails'>";
    result += "<tr><td class='auctionlabel'>Status:</td><td>" + auction["status"] + "</td></tr>";
    result += "<tr><td class='auctionlabel'>Seller:</td><td>" + auction["seller"] + "</td></tr>";
    result += "<tr><td class='auctionlabel'>Title:</td><td>" + auction["title"] + "</td></tr>";
    result += "<tr><td class='auctionlabel'>Description:</td><td>" + auction["description"] + "</td></tr>";
    result += "<tr><td class='auctionlabel'>Current Bid:</td><td>" + web3.fromWei(auction["currentBid"], "ether") + " ETH" + "</td></tr>";
    result += "<tr><td class='auctionlabel'>Number of Bids:</td><td>" + auction["bidCount"] + "</td></tr>";
    result += "<tr><td class='auctionlabel'>Deadline Block Number:</td><td>" + auction["blockNumberOfDeadline"] + " <span id='deadlineCountdown'></span>" + "</td></tr>";
    
    //Activate auction button
    if (auction["status"] == "Pending" && isOwner()) {
	result += "<tr><td class='auctionLabel'>Activate Auction:</td><td><button id='activation_button' onclick='activateAuction()'>Activate Auction</button></td></tr>";
    } 

    //Place bid button
    if (auction["status"] == "Active" && currentBlockNumber <= auction["blockNumberOfDeadline"]) {
	result += "<tr><td class='auctionLabel'>Bid (in eth):</td><td><input type='text' id='bid_value' placeholder='eg 3.0'></input></td></tr>";
	result += "<tr><td class='auctionLabel'>&nbsp;</td><td><button id='bid_button' class='btn btn-primary' onclick='placeBid()'>Place Bid</button></td></tr>";
    }

    //End auction button
    if (auction["status"] == "Active" && currentBlockNumber > auction["blockNumberOfDeadline"]) {
	result += "<tr><td class='auctionLabel'>End Auction:</td><td><button id='end_button' onclick='endAuction()'>End Auction</button></td></tr>";
    }

    result += "</table>";

  return result;
}


window.onload = function() {
    $("#header").load("header.html");
    $("#right-column").load("rightPanel.html", function() {
	updateInfoBox(infoBoxHTMLOwnerPending);

        getContractAddress(function(ah_addr, sn_addr, error) {
	    if (error != null) {
	        setStatus("Cannot find network. Please run an ethereum node or use Metamask.", "error");
	        console.log(error);
	        throw "Cannot load contract address";
	    }

	    auctionHouseContract = AuctionHouse.at(ah_addr);
	    sampleNameContract = SampleName.at(sn_addr);

	    web3.eth.getAccounts(function(err, accs) {

	        accounts = accs;
	        account = accounts[0];

	        updateEthNetworkInfo();
	        refreshAuction();
	        updateBlockNumber();

	        watchEvents();
	    });
        });
    });

}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function watchEvents() {
    var events = auctionHouseContract.allEvents();

    events.watch(function(err, msg) {
      if(err) {
          console.log("Error: " + err);
      } else { 
          console.log("Got an event: " + msg.event);
      }
        });

        var filter = web3.eth.filter("latest");
        filter.watch(function(err, block) {
      // Call get block number on every block
      updateBlockNumber();
    });
}

function updateBlockNumber() {
    web3.eth.getBlockNumber(function(err, blockNumber) {
	currentBlockNumber = blockNumber;
	console.log("Block number is : " + blockNumber);
	console.log("auction is: " + auction);

	if (auction != null) {
	    var blocksLeft = auction['blockNumberOfDeadline'] - currentBlockNumber;

	    if (blocksLeft > 0) {
		var minsLeft = blocksLeft * 12.5 / 60;  // About 12 second block times
		$("span#deadlineCountdown").text("(" + blocksLeft + " blocks, and " + minsLeft + " minutes from now)");
	    } else if (blocksLeft <= 0 && $("#bid_button").length == 1) {
            refreshAuction();
        }
	}
    });
}
