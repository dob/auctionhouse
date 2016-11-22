getContractAddress = function(callback) {
    web3.version.getNetwork(function(error, result) {
        if (error != null) {
            console.log('Unknown network');
            ah_contract_addr = '';
            sn_contract_addr = '';
            error = "Failed to load ethereum network and smart contract";
        } else if (result == "1" || result == "2" || result == "3'") {
            if (result == "1") {
                ah_contract_addr = '';
                sn_contract_addr = '';
                error("AuctionHouse is not deployed to the main net yet, please try the test net");
            }

            //Testnet Setup Morden
            if (result == "2") {
                ah_contract_addr = "0x131bec75342a54ffea3087bda5ba720394c486a9";
                sn_contract_addr = "0xfe4362ad1c80bbe89705f774af1d769a0f305605";
            }

            // New testnet Ropsten
            if (result == "3") {
                ah_contract_addr = "0x7ac337474ca82e0f324fbbe8493f175e0f681188";
                sn_contract_addr = "0xd1555741b88895a38cd456842188df2cd112b4ba";
            }
        } else {
            //For dev purposes - we use Fieldbook as a registry for our local contract address
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
