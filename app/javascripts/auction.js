var accounts;
var account;
var auctions;
var auctionHouseContract;
var auction;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerHTML = message;
};

function updateAddress() {
    var address = document.getElementById("address");
    address.innerHTML = account;
}

function refreshAuction() {
    var auctionId = getParameterByName("auctionId");
    var ah = AuctionHouse.deployed();
    auction = {"auctionId": auctionId};

    auctionHouseContract.getAuctionCount.call().then(function(auctionCount) {
      // console.log(auctionCount.toNumber());
      if (auctionCount.toNumber() < auctionId) {
        setStatus("Cannot find auction: " + auctionId);
        throw new Error();
        //Redirect to 404 page
      }
    });

    ah.getStatus.call(auctionId).then(function(auctionStatus) {
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

      ah.getAuction.call(auctionId).then(function(result) {

// a.seller,
//     a.contractAddress,
//     a.recordId,
//     a.title,
//     a.description,
//     a.blockNumberOfDeadline,
//     a.distributionCut,
//     a.distributionAddress,
//     a.startingPrice,
//     a.reservePrice,
//     a.currentBid,
//     a.bids.length
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

        // console.log(result);
        // console.log(auction);

        var container = document.getElementById("auction_container");
        container.innerHTML = constructAuctionView(auction);

      });

    });

    // ah.getAuctionsCountForUser.call(account).then(function(count) {
    // 	console.log("User has this many auctions " + count);
    // 	for (var i = 0; i < count; i ++) {
  	 //    ah.getAuctionIdForUserAndIdx.call(account, i).then(function(idx) {
    //   		ah.getAuction.call(idx).then(function(auc) {
    //   		    console.log("Found an auction: " + auc[3]);
    //   		    res = res + "<br>" + auc[3] + ": " + auc[10] + " ETH";
    //   		    auctionSection.innerHTML = res;
    //   		});
  	 //    });
	   //  }
    // });
}

// function activateAuction(auctionId, recordId) {
function activateAuction() {
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
  console.log("bid: " + bid);

  if (bid < auction["currentBid"])
    setStatus("Bid has to be at least " + auction["currentBid"]);

  console.log({from:account, value:web3.toWei(bid, 'ether'), gas: 1400000});
  console.log(auction["auctionId"]);
  auctionHouseContract.placeBid(auction["auctionId"], {from:account, value:web3.toWei(bid, 'ether'), gas: 1400000}).then(function(txnId) {
    console.log("Bid txnId: " + txnId);
    refreshAuction();
  });
}

function isOwner() {
  return true;
}

function constructAuctionView(auction) {
  result = "<div id='status'>Status: " + auction["status"] + "</div>";
  result += "<div id='seller_address'>Seller: " + auction["seller"] + "</div>";
  result += "<div id='title'>Title: " + auction["title"] + "</div>";
  result += "<div id='description'>Description: " + auction["description"] + "</div>";
  result += "<div id='currentBid'>Current Bid: " + auction["currentBid"] + " ethers</div>";
  result += "<div id='bidCount'>Number of Bids: " + auction["bidCount"] + "</div>";

  if (auction["status"] == "Pending" && isOwner()) {
    result += "<button id='activation_button' onclick='activateAuction()'>Activate Auction</button>";
  } else if (auction["status"] == "Active") {
    result += "<label for='bid_value'>Bid (in eth):</label><input type='text' id='bid_value' placeholder='eg 3.0'></input>";
    result += "<button id='bid_button' onclick='placeBid()'>Place Bid</button>";
  }

  return result;
}

function createAuction() {
    var sn = SampleName.deployed();
    var ah = AuctionHouse.deployed();
    var marketer = "0x536d6b87f21d8bbf23dd7f33fc3ca90e85cba0b6";

    setAuctionStatus("Initiating auction, please wait.");

    var recordId = document.getElementById("nameToAuction").value;
    sn.owner.call(recordId).then(function(res) {
	if (!(res === account)) {
	    setAuctionStatus("Looks like you don't own that name");
	    return;
	}
	var startingPrice = web3.toWei(parseFloat(document.getElementById("startingPrice").value), "ether");
	var reservePrice = web3.toWei(parseFloat(document.getElementById("reservePrice").value), "ether");
	var deadline = web3.eth.blockNumber + parseInt(document.getElementById("deadline").value);
	console.log("Setting deadline to " + deadline + " and current block num is " + web3.eth.blockNumber);
	console.log("Prices, starting/reserve " + startingPrice + "/" + reservePrice);
	console.log("Marketer is: " + marketer);

	ah.createAuction(recordId,
			 "Auction for this unique name!",
			 sn.address,
			 recordId,
			 deadline,
			 startingPrice,
			 reservePrice,
			 10,
			 marketer,
			 {from: account, gas:500000}).then(function(txId) {

			     setAuctionStatus("Auction created in transaction: " + txId);
			     refreshAuction();
			 });
    });
};

window.onload = function() {
  auctionHouseContract = AuctionHouse.deployed();

  $("#header").load("header.html"); 
  $("#footer").load("footer.html"); 

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

      updateAddress();
      refreshAuction();
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
    //var failure = ah.LogFailure();
    //var created = ah.AuctionCreated();

    events.watch(function(err, msg) {
	if(err) {
	    console.log("Error: " + err);
	} else { 
	    console.log("Got an event: " + msg.event);
	}
    });
}
