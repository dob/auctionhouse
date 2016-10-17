getContractAddress = function(callback) {
    web3.version.getNetwork(function(error, result) {
        if (error != null) {
            console.log('Unknown network');
            ah_contract_addr = '';
            sn_contract_addr = '';
            error = "Failed to load ethereum network and smart contract";
        } else {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "GET", "https://api.fieldbook.com/v1/5802f2556147990300c7827b/sheet_1?network=" + result + "&key=auctionhouse", false );
            xmlHttp.send( null );
            ah_contract_addr = JSON.parse(xmlHttp.responseText)[0]["value"];

            xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "GET", "https://api.fieldbook.com/v1/5802f2556147990300c7827b/sheet_1?network=" + result + "&key=samplename", false );
            xmlHttp.send( null );
            sn_contract_addr = JSON.parse(xmlHttp.responseText)[0]["value"];
        }

        console.log("network id: " + result);
        console.log("auction house contract addr: " + ah_contract_addr);
        console.log("sample name contract addr: " + sn_contract_addr);

        callback(ah_contract_addr, sn_contract_addr, error);

    });
};
