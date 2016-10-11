var accounts;
var account;

function setStatus(message) {
  var status = document.getElementById("status");
  status.innerHTML = message;
};

function sendCoin() {
    var sn = SampleName.deployed();
    var recordId = "8938doug3868686.name22";

  setStatus("Initiating transaction... (please wait)");

  sn.addRecord(recordId, account, recordId, account, {from: account}).then(function(txnId) {
      console.log("Transaction id is : " + txnId);
      setStatus("Transaction complete!");

      sn.owner.call(recordId).then(function(res) {
	  setStatus("Owner is: " + res);
      });
  }).catch(function(e) {
    console.log(e);
    setStatus("Error sending coin; see log.");
  });
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
    account = accounts[1];
  });
}
