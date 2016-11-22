function setStatus(message, category) {
    var status = document.getElementById("statusMessage");
    status.innerHTML = message;

    var panel = $("#statusPanel");
    panel.removeClass("panel-warning");
    panel.removeClass("panel-danger");
    panel.removeClass("panel-success");

    if (category === "warning") {
	panel.addClass("panel-warning");
    } else if (category === "error") {
	panel.addClass("panel-danger");
    } else {
	panel.addClass("panel-success");
    }    
};

function updateEthNetworkInfo() {
    var address = document.getElementById("address");
    address.innerHTML = account;

    var ethBalance = document.getElementById("ethBalance");
    web3.eth.getBalance(account, function(err, bal) {
	ethBalance.innerHTML = web3.fromWei(bal, "ether") + " ETH";
    });

    var withdrawBalance = document.getElementById("withdrawBalance");

    if (typeof auctionHouseContract != 'undefined' && typeof account != 'undefined') {
        web3.eth.getBalance(auctionHouseContract.address, function(err, bal) {
            console.log("contract balance: " + bal);
        });

        auctionHouseContract.getRefundValue.call({from:account}).then(function(refundBalance) {
            var balance = web3.fromWei(refundBalance, "ether");
            withdrawBalance.innerHTML = web3.fromWei(refundBalance, "ether") + " ETH";
            if (balance == 0) {
                $("#withdrawButton").hide();
            } else {
                $("#withdrawButton").show();
            }
        });
    } else {
        $("#withdrawButton").hide();
    }

    var network = document.getElementById("network");
    var provider = web3.version.getNetwork(function(err, net) {
	var networkDisplay;

	if(net == 1) {
	    networkDisplay = "Ethereum MainNet";
	} else if (net == 2) {
	    networkDisplay = "Morden TestNet";
        } else if (net == 3) {
            networkDisplay = "Ropsten TestNet";
	} else {
	    networkDisplay = net;
	}
	    
	network.innerHTML = networkDisplay;
    });
}

function withdraw() {
    if (typeof auctionHouseContract != 'undefined' && typeof account != 'undefined') {
        setStatus("Withdrawing fund...", "warning"); 
        showSpinner();

        auctionHouseContract.withdrawRefund({from:account, gas:500000}).then(function(txId) {
            setStatus("Withdraw finished."); 
            hideSpinner();
            updateEthNetworkInfo();
        })
    }
}

function updateInfoBox(html) {
    var infoBox = document.getElementById("infoPanelText");
    infoBox.innerHTML = html;
}

function hideSpinner() {
    $("#spinner").hide();
}

function showSpinner() {
    $("#spinner").show();
}


