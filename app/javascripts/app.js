var accounts;
var account;
var auctions;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerHTML = message;
};

function updateAddress() {
    var address = document.getElementById("address");
    address.innerHTML = account;

}

function updateNetwork() {
    var network = document.getElementById("network");
    var provider = web3.version.getNetwork(function(err, net) {
	network.innerHTML = net;
    });
}

function updateAuctions() {
    var auctionSection = document.getElementById("userAuctions");
    var ah = AuctionHouse.deployed();
    var res = "";

    setStatus("Auctions being fetched...");

    ah.getAuctionCount.call().then(function(count) {
	console.log("Contract has this many auctions " + count);

	if (count <= 0) {
	    setStatus("No auctions found");
	}

	var aucs = [];
	
	for (var i = 0; i < count; i++) {
	    ah.getAuction.call(i).then(function(auction) {
		// Wrapping in a function because I need to access i
		aucs.push(auction);

		if (aucs.length == count) {
		    res = "<table>";
		    res += "<tr><td>Title</td><td>Current Bid</td><td>Number of Bids</td><td>Ending Block</td></tr>";

		    for (var j = 0; j < count; j++) {
			var auc = aucs[j];
			res = res + "<tr>";
			res = res + "<td><a href='auction.html?auctionId=" + j + "'>" + auc[3] + "</a></td>";
			res = res + "<td>" + auc[10] + " ETH" + "</td>";
			res = res + "<td>" + auc[11] + "</td>";
			res = res + "<td>" + auc[5] + "</td>";
			res = res + "</tr>";
		    }
		    res = res + "</table>";
		    auctionSection.innerHTML = res;
		    setStatus("");
		}
	    });
	}
    });    
}

window.onload = function() {
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
	updateAuctions();
    });

    updateNetwork();
}

