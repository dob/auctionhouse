getContractAddress = function(callback) {
    web3.version.getNetwork(function(error, result) {
        if (result == 2) {
            //testnet
            ah_contract_addr = '';
            sn_contract_addr = '';
        } else if (result == 1) {
            // mainNet:
            ah_contract_addr = '';
            sn_contract_addr = '';
        } else if (result=1000) {
            // etang's local
            ah_contract_addr = '0x16a78c4d4d9d055a4a31e65540a3d22e9390c8e3';
            sn_contract_addr = '0xec0ce7409e826d12d24e82328cac8e233b592b1b';
        } else if (result=1999) {
            // dob's local
            ah_contract_addr = '';
            sn_contract_addr = '';
        } else {
            console.log('Unknown network');
            ah_contract_addr = '';
            sn_contract_addr = '';
            error = "Failed to load ethereum network and smart contract";
        }

        console.log("network id: " + result);
        console.log("auction house contract addr: " + ah_contract_addr);
        console.log("sample name contract addr: " + sn_contract_addr);

        callback(ah_contract_addr, sn_contract_addr, error);

    });
};
