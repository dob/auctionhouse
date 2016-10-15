var accounts;
var account;
var auctions;
var auctionHouseContract;


function setStatus(message) {
  var status = document.getElementById("statusMessage");
  status.innerHTML = message;
};

function updateAddress() {
    var address = document.getElementById("address");
    address.innerHTML = account;

    var ethBalance = document.getElementById("ethBalance");
    web3.eth.getBalance(account, function(err, bal) {
	ethBalance.innerHTML = web3.fromWei(bal, "ether") + " ETH";
    });
}

function updateNetwork() {
    var network = document.getElementById("network");
    var provider = web3.version.getNetwork(function(err, net) {
    	network.innerHTML = net;
    });
}

function updateAuctions() {
    var auctionSection = document.getElementById("userAuctions");
    var res = "";

    setStatus("Auctions being fetched...");

    auctionHouseContract.getAuctionCount.call().then(function(count) {
	console.log("Contract has this many auctions " + count);

	if (count <= 0) {
	    setStatus("No auctions found");
	}

	var aucs = [];
	
	for (var i = 0; i < count; i++) {
	    auctionHouseContract.getAuction.call(i).then(function(auction) {
		// Wrapping in a function because I need to access i
		aucs.push(auction);

		if (aucs.length == count) {
		    for (var j = 0; j < count; j++) {
			var auc = aucs[j];
			res = res + "<tr>";
			res = res + "<td><a href='auction.html?auctionId=" + j + "'>" + auc[3] + "</a></td>";
			res = res + "<td>" + web3.fromWei(auc[10], "ether") + " ETH" + "</td>";
			res = res + "<td>" + auc[11] + "</td>";
			res = res + "<td>" + auc[5] + "</td>";
			res = res + "</tr>";
		    }
		    auctionSection.innerHTML = res;
		    setStatus("");
		}
	    });
	}
    });    
}

window.onload = function() {
    getContractAddress(function(ah_addr, sn_addr, error) {
        if (error != null) {
          setStatus("Cannot find network");
          console.log(error);
          throw "Cannot load contract address";
        }

        auctionHouseContract = AuctionHouse.at(ah_addr);

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

    });
}

