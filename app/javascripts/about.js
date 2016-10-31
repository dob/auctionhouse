var infoBoxHTMLAbout = "<p>If you have any additional questions email us at <a href='mailto:petkanics@gmail.com'>petkanics@gmail.com</a>.</p>";

var accounts;
var account;

window.onload = function() {
    $("#right-column").load("rightPanel.html", function() {
        updateInfoBox(infoBoxHTMLAbout);


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
        });
    });
}
