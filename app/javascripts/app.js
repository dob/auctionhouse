var accounts;
var account;
var auctions;
var auctionHouseContract;

function updateAuctions() {
    var auctionSection = document.getElementById("userAuctions");
    var res = "";

    setStatus("Auctions being fetched...", "warning");

    auctionHouseContract.getAuctionCount.call().then(function(count) {
	console.log("Contract has this many auctions " + count);

	if (count <= 0) {
	    setStatus("No auctions found", "error");
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
            setStatus("Cannot find network. Please run an ethereum node or use Metamask.", "error");
            console.log(error);
            throw "Cannot load contract address";
        }

        auctionHouseContract = AuctionHouse.at(ah_addr);

        web3.eth.getAccounts(function(err, accs) {
            if (err != null) {
		alert("There was an error fetching your accounts.");
		return;
            }
	    accounts = accs;
	    account = accounts[0];

	    updateEthNetworkInfo();
	    updateAuctions();
	});
    });
}

