var accounts;
var account;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerHTML = message;
};

function setAuctionStatus(message) {
  var status = document.getElementById("auctionstatus");
  status.innerHTML = message;
};

function updateAddress() {
    var address = document.getElementById("address");
    address.innerHTML = account;
}

function createAsset() {
    var sn = SampleName.deployed();
    var recordId = document.getElementById("nameToReserve").value;

  setStatus("Initiating transaction... (please wait)");

  sn.addRecord(recordId, account, recordId, account, {from: account}).then(function(txnId) {
      console.log("Transaction id is : " + txnId);
      setStatus("Transaction complete!");

      sn.owner.call(recordId).then(function(res) {
	  if (res === account) {
	      setStatus("You are the proud owner of the name: " + recordId);
	  } else {
	      setStatus("It looks like the owner of that name is: " + res);
	  }
      });
  }).catch(function(e) {
    console.log(e);
    setStatus("Error registering name. See log.");
  });
};

function createAuction() {
    var sn = SampleName.deployed();
    var ah = AuctionHouse.deployed();
    var marketer = "0x536d6b87f21d8bbf23dd7f33fc3ca90e85cba0b6";

    setAuctionStatus("Initiating auction, please wait.");

    var recordId = document.getElementById("nameToReserve").value;
    sn.owner.call(recordId).then(function(res) {
	if (!(res === account)) {
	    setAuctionStatus("Looks like you don't own that name");
	    return;
	}
	var startingPrice = web3.toWei(parseFloat(document.getElementById("startingPrice").value), "ether");
	var reservePrice = web3.toWei(parseFloat(document.getElementById("reservePrice").value), "ether");
	var deadline = web3.eth.blockNumber + parseInt(document.getElementById("deadline").value);

	ah.createAuction(recordId,
			 "Auction for this unique name!",
			 sn.address,
			 recordId,
			 deadline,
			 startingPrice,
			 reservePrice,
			 10,
			 marketer,
			 {from: account}).then(function(txId) {

			     setAuctionStatus("Auction created in transaction: " + txId)
			 });
    })
};

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
  });
}
