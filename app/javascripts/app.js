var accounts; 
var account;
var auctions;
var auctionHouseContract;
var aucs = [];

function getAuction(auctionId) {
    auctionHouseContract.getAuction.call(auctionId).then(function(auction) {
        console.log("loading: " + auctionId);
        auction[12] = auctionId;
        aucs.push(auction);
    });
}

function waitAndRefresh(count) {
    if (aucs.length < count) {
        console.log("sleeping");
        setTimeout(waitAndRefresh, 500, count);
    } else {
        var auctionSection = document.getElementById("userAuctions");
        var res = "";
        for (var j = 0; j < count; j++) {
            var auc = aucs[j];
            if (parseInt(auc[5]) > currentBlockNumber) {
                res = res + "<tr>";
                res = res + "<td><a href='auction.html?auctionId=" + auc[12] + "'>" + auc[3] + "</a></td>";
                res = res + "<td>" + web3.fromWei(auc[10], "ether") + " ETH" + "</td>";
                res = res + "<td>" + auc[11] + "</td>";
                res = res + "<td>" + auc[5] + "</td>";
                res = res + "</tr>";
            }
        }
        console.log("Refreshing auctions!");
        auctionSection.innerHTML = res;
        setStatus("");
    }
}

function updateAuctions() {

    setStatus("Auctions being fetched...", "warning");

    auctionHouseContract.getAuctionCount.call().then(function(count) {
    	console.log("Contract has this many auctions " + count);

    	if (count <= 0) {
    	    setStatus("No auctions found", "error");
    	}

    	var aucs = [];
    	
    	for (var i = 0; i < count; i++) {
            getAuction(i);
    	}

        waitAndRefresh(count);
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
        updateBlockNumber();

	});
    });
}

function updateBlockNumber() {
    web3.eth.getBlockNumber(function(err, blockNumber) {
    currentBlockNumber = blockNumber;
    console.log("Current block number is: " + blockNumber);
    });
}


