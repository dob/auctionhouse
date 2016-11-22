var accounts;
var account;
var auctions;
var currentBlockNumber;
var auctionHouseContract;
var sampleNameContract;

var infoBoxHTMLCreate = "<p>Here's where you can create an auction to auction off any on-chain item you own that conforms to the <a href='https://testnet.etherscan.io/address/0x7ac337474ca82e0f324fbbe8493f175e0f681188#code'>Asset contract</a>. Since this is a prototype and very few contracts adhere to this, you have the chance to register a 'name' that does, so you can create a test auction. First register any name, such as myname.address, and when that transaction confirms, create an auction for that same name.</p><p>After successful auction creation, you can visit the page for that auction to activate it.</p>";

function updateAuctions() {
    var auctionSection = document.getElementById("userAuctions");
    var res = "";

    auctionHouseContract.getAuctionsCountForUser.call(account).then(function(count) {
	console.log("User has this many auctions " + count);
	for (var i = 0; i < count; i ++) {
	    auctionHouseContract.getAuctionIdForUserAndIdx.call(account, i).then(function(idx) {
		auctionHouseContract.getAuction.call(idx).then(function(auc) {
		    console.log("Found an auction: " + auc[3]);
		    var bidAmount = web3.fromWei(auc[10], "ether");
		    res = res + "<br><a href='auction.html?auctionId=" + idx + "'>" + auc[3] + "</a>: " + bidAmount + " ETH";
		    auctionSection.innerHTML = res;
		});
	    });
	}
    });    
}

function createAsset() {
    var recordId = document.getElementById("nameToReserve").value;

    setStatus("Initiating transaction... (please wait)", "warning");
  showSpinner();

  sampleNameContract.addRecord(recordId, account, recordId, account, {from: account}).then(function(txnId) {
      console.log("Transaction id is : " + txnId);
      hideSpinner();

      sampleNameContract.owner.call(recordId).then(function(res) {
	  if (res === account) {
	      setStatus("You are the proud owner of the name: " + recordId);
	  } else {
	      setStatus("It looks like the owner of that name is: " + res, "error");
	  }
      });
  }).catch(function(e) {
    console.log(e);
      setStatus("Error registering name. See log.", "error");
    hideSpinner();
  });
};

function createAuction() {
    var marketer = "0x8F9def924026c13766A4B3BA9658279F1f75D8e6";

    setStatus("Initiating auction, please wait.", "warning");
    showSpinner();

    var recordId = document.getElementById("nameToAuction").value;
    var contractAddress = document.getElementById("contractAddress").value;
    var assetInstanceContract = Asset.at(contractAddress);
    
    assetInstanceContract.owner.call(recordId).then(function(res) {
	if (!(res === account)) {
	    setStatus("Looks like you don't own that asset", "error");
	    hideSpinner();
	    return;
	}
	var startingPrice = web3.toWei(parseFloat(document.getElementById("startingPrice").value), "ether");
	var reservePrice = web3.toWei(parseFloat(document.getElementById("reservePrice").value), "ether");
	var deadline = currentBlockNumber + parseInt(document.getElementById("deadline").value);
	console.log("Setting deadline to " + deadline + " and current block num is " + currentBlockNumber);
	console.log("Prices, starting/reserve " + startingPrice + "/" + reservePrice);
	console.log("Marketer is: " + marketer);

	auctionHouseContract.createAuction(recordId,
			 "Auction for this unique name!",
			 contractAddress,
			 recordId,
			 deadline,
			 startingPrice,
			 reservePrice,
			 5,
			 marketer,
			 {from: account, gas:500000}).then(function(txId) {
          web3.eth.getTransactionReceipt(txId, function(error, receipt) {
            if (receipt["gasUsed"] == 500000) {
              setStatus("Auction creation failed", "error");
              hideSpinner();
            } else {
              setStatus("Auction created in transaction: " + txId);
              hideSpinner();
              updateAuctions();
            }

          });
			 });
    });
};

window.onload = function() {
    $("#right-column").load("rightPanel.html", function() {
	updateInfoBox(infoBoxHTMLCreate);

        getContractAddress(function(ah_addr, sn_addr, error) {
	    if (error != null) {
	        setStatus("Cannot find network. Please run an ethereum node or use Metamask.", "error");
	        console.log(error);
	        throw "Cannot load contract address.";
	    }

	    auctionHouseContract = AuctionHouse.at(ah_addr);
	    sampleNameContract = SampleName.at(sn_addr);

	    // Set the value of contract address field to the sampleName contract
	    $("#contractAddress").val(sn_addr);

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
	        updateAuctions();
	        updateBlockNumber();
	        watchEvents();
	    });
        });
    });
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
