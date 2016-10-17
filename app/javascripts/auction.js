var accounts;
var account;
var auctions;
var auctionHouseContract;
var auction;
var currentBlockNumber;

var infoBoxHTMLOwnerPending = "<p>Right now this auction is <b>pending</b>. If you're the owner you can click the activate button, which will initiate two ethereum transactions. The first will transfer ownership of your asset to the <a href='https://github.com/dob/auctionhouse/contracts/AuctionHouse.sol'>AuctionHouse contract</a>. The second will activate the auction.</p><p>Don't worry, if the auction doesn't succeed by the deadline, then ownership of your asset will be transfered back to you.</p>";

var infoBoxHTMLActive = "<p>Right now this auction is <b>active</b>. You can place a bid, in ether, for this item if you are running <a href='http://metamask.io'>Metamask</a>. It will ask you to authorize your bid transaction, and the ether for your bid will be held by the <a href='https://github.com/dob/auctionhouse/contracts/AuctionHouse.sol'>AuctionHouse contract</a> until you either win the item, or until you are out bid. At that point your bid amount will be transfered back to you or your won item will be transfered to you by the contract.</p>";

var infoBoxHTMLInactive = "<p>Right now this auction is either over, or was cancelled. You can not place a bid on this item at this point. Try browsing the other <a href='index.html#auctions'>currently active auctions</a>.</p>";


function refreshAuction() {
    var auctionId = getParameterByName("auctionId");
    var ah = AuctionHouse.deployed();
    auction = {"auctionId": auctionId};

    auctionHouseContract.getAuctionCount.call().then(function(auctionCount) {
	// console.log(auctionCount.toNumber());
	if (auctionCount.toNumber() < auctionId) {
            setStatus("Cannot find auction: " + auctionId, "error");
            throw new Error();
            //Redirect to 404 page
	}
    });

    ah.getStatus.call(auctionId).then(function(auctionStatus) {
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

	ah.getAuction.call(auctionId).then(function(result) {
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
  var sn = SampleName.deployed();
  console.log(auction["recordId"]);
  console.log(auctionHouseContract.address);

  sn.setOwner(auction["recordId"], auctionHouseContract.address, {from: account, gas: 500000}).then(function(txnId) {
    console.log("set owner transaction: " + txnId);
    //Activate the auction
    auctionHouseContract.activateAuction(auction["auctionId"], {from: account, gas: 500000}).then(function(txnId) {
      console.log(txnId);
      refreshAuction();
    });
  });
}

function placeBid() {
    var bid = document.getElementById("bid_value").value;
    bid = web3.toWei(bid, "ether");

    setStatus("Bid is being placed, hang tight...", "warning");

    if (bid < auction["currentBid"]) {
	setStatus("Bid has to be at least " + auction["currentBid"], "error");
	return;
    }

    console.log({from:account, value:bid, gas: 1400000});

    var gas = 1400000;
    auctionHouseContract.placeBid(auction["auctionId"], {from:account, value:bid, gas: gas}).then(function(txnId) {
	console.log("Bid txnId: " + txnId);
	web3.eth.getTransactionReceipt(txnId, function(err, txnReceipt) {
	    if (txnReceipt.gasUsed == gas) {
		console.log("We had a failed bid " + txnReceipt);
		setStatus("Bid failed", "error");
	    } else {
		console.log("We had a successful bid " + txnReceipt);
		setStatus("Bid succeeded!", "success");
	    }
	});
	refreshAuction();
    });
}

function endAuction() {
  auctionHouseContract.endAuction(auction["auctionId"], {from:account, gas: 1400000}).then(function(txnId) {
    console.log("End auction txnId: " + txnId)
    refreshAuction();
  });
}

function isOwner() {
  return auction["seller"] == account;
}

function constructAuctionView(auction) {
  result = "<div id='status'>Status: " + auction["status"] + "</div>";
  result += "<div id='seller_address'>Seller: " + auction["seller"] + "</div>";
  result += "<div id='title'>Title: " + auction["title"] + "</div>";
  result += "<div id='description'>Description: " + auction["description"] + "</div>";
    result += "<div id='currentBid'>Current Bid: " + web3.fromWei(auction["currentBid"], "ether") + " ETH</div>";
  result += "<div id='bidCount'>Number of Bids: " + auction["bidCount"] + "</div>";
  result += "<div id='deadline'>Deadline Block Number: " + auction["blockNumberOfDeadline"] + " <span id='deadlineCountdown'></span></div>";

  //Activate auction button
  if (auction["status"] == "Pending" && isOwner()) {
    result += "<button id='activation_button' onclick='activateAuction()'>Activate Auction</button>";
  } 

  //Place bid button
  if (auction["status"] == "Active" && currentBlockNumber <= auction["blockNumberOfDeadline"]) {
    result += "<label for='bid_value'>Bid (in eth):</label><input type='text' id='bid_value' placeholder='eg 3.0'></input>";
    result += "<button id='bid_button' onclick='placeBid()'>Place Bid</button>";
  }

  //End auction button
  if (auction["status"] == "Active" && auction["seller"] == account && currentBlockNumber > auction["blockNumberOfDeadline"]) {
    result += "<button id='end_button' onclick='endAuction()'>End Auction</button>";
  }

  return result;
}


window.onload = function() {
  auctionHouseContract = AuctionHouse.deployed();

    $("#header").load("header.html");
    $("#right-column").load("rightPanel.html", function() {
	updateInfoBox(infoBoxHTMLOwnerPending);
    });

  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }

    if (accs.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }

      accounts = accs;
      account = accounts[0];

      updateEthNetworkInfo();
      refreshAuction();
      updateBlockNumber();

      watchEvents();
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
    var ah = AuctionHouse.deployed();
    var events = ah.allEvents();

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
		$("span#deadlineCountdown").text("(" + blocksLeft + " blocks, and " + minsLeft + "minutes from now)");
	    }
	}
    });
}
