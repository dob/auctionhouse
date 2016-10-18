function setStatus(message, category) {
    var status = document.getElementById("statusMessage");
    status.innerHTML = message;

    var panel = $("#statusPanel");
    panel.removeClass("panel-warning");
    panel.removeClass("panel-error");
    panel.removeClass("panel-success");

    if (category === "warning") {
	panel.addClass("panel-warning");
    } else if (category === "error") {
	panel.addClass("panel-error");
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

    var network = document.getElementById("network");
    var provider = web3.version.getNetwork(function(err, net) {
	var networkDisplay;

	if(net == 1) {
	    networkDisplay = "Ethereum MainNet";
	} else if (net == 2) {
	    networkDisplay = "Morden TestNet";
	} else {
	    networkDisplay = net;
	}
	    
	network.innerHTML = networkDisplay;
    });
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


