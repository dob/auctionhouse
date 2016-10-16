var accounts;
var account;
var auctions;
var auctionHouseContract;
var sampleNameContract;
var auction;
var currentBlockNumber;

// function setStatus(message) {
//   var status = document.getElementById("statusMessage");
//   status.innerHTML = message;
// };

function refreshAuction() {
    var auctionId = getParameterByName("auctionId");
    auction = {"auctionId": auctionId};

    auctionHouseContract.getAuctionCount.call().then(function(auctionCount) {
      // console.log(auctionCount.toNumber());
      if (auctionCount.toNumber() < auctionId) {
        setStatus("Cannot find auction: " + auctionId);
        throw new Error();
        //Redirect to 404 page
      }
    });

    auctionHouseContract.getStatus.call(auctionId).then(function(auctionStatus) {
      // console.log("status:" + auctionStatus);
      if (auctionStatus == 0) {
        auction["status"] = "Pending";
      } else if (auctionStatus == 1) {
        auction["status"] = "Active";
      } else if (auctionStatus == 2) {
        auction["status"] = "Inactive";
      } else {
        alert("Unknown status: " + auctionStatus);
        // console.log("Unknown status: " + auctionStatus);
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

// function activateAuction(auctionId, recordId) {
function activateAuction() {
  if (!isOwner()) {
    setErrorMsg("Only seller can activate auction.");
  }

  //Transfer ownership to the contract
  // var sn = SampleName.deployed();
  console.log(auction["recordId"]);
  console.log(auctionHouseContract.address);

  setStatus("Transfering ownership to the contract...");
  showSpinner();
  sampleNameContract.setOwner(auction["recordId"], auctionHouseContract.address, {from: account, gas: 500000}).then(function(txnId) {
    console.log("set owner transaction: " + txnId);
    setConfirmationMsg("Ownership transfer complete!");
    hideSpinner();

    //Activate the auction
    setStatus("Activating auction...");
    showSpinner();
    auctionHouseContract.activateAuction(auction["auctionId"], {from: account, gas: 500000}).then(function(txnId) {
      console.log("activate auction txnId" + txnId);
      setConfirmationMsg("Auction activated!");
      hideSpinner();
      refreshAuction();
    });
  });
}

function placeBid() {
    var bid = document.getElementById("bid_value").value;
    bid = web3.toWei(bid, "ether");

    setStatus("Bid is being placed, hang tight...")
    showSpinner();

    if (bid < auction["currentBid"]) {
    	setErrorMsg("Bid has to be at least " + web3.fromWei(auction["currentBid"], "ether"));
      hideSpinner();
    	return;
    }

    var gas = 1400000;
    auctionHouseContract.placeBid(auction["auctionId"], {from:account, value:bid, gas: gas}).then(function(txnId) {
    	console.log("Bid txnId: " + txnId);

    	web3.eth.getTransactionReceipt(txnId, function(err, txnReceipt) {
    	  if (txnReceipt.gasUsed == gas) {
      		console.log("We had a failed bid " + txnReceipt);
      		setErrorMsg("Bid failed");
          hideSpinner();
    	  } else {
      		console.log("We had a successful bid " + txnReceipt);
      		setConfirmationMsg("Bid succeeded!");
          hideSpinner();
    	  }
  	  });

  	  refreshAuction();
    });
}

function endAuction() {
  setStatus("Ending auction...");
  showSpinner();
  auctionHouseContract.endAuction(auction["auctionId"], {from:account, gas: 1400000}).then(function(txnId) {
    console.log("End auction txnId: " + txnId)
    setConfirmationMsg("Auction ended successfully.");
    hideSpinner();
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
  result += "<div id='deadline'>Deadline Block Number: " + auction["blockNumberOfDeadline"] + "</div>";

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
  $("#header").load("header.html"); 

  getContractAddress(function(ah_addr, sn_addr, error) {
    if (error != null) {
      setErrorMsg("Cannot find network");
      console.log(error);
      throw "Cannot load contract address";
    }

    auctionHouseContract = AuctionHouse.at(ah_addr);
    sampleNameContract = SampleName.at(sn_addr);

    web3.eth.getAccounts(function(err, accs) {

      if (err != null) {
        console.log("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        console.log("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

        accounts = accs;
        account = accounts[0];

        updateAddress();
        refreshAuction();
        updateBlockNumber();
        updateNetwork();
        watchEvents();
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
  console.log("Current block number is: " + blockNumber);
    });
}
