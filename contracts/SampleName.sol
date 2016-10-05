// Sample implementation of a non fungible asset, which is a name resolved to
// an ethereum wallet address

import "Asset.sol";

contract SampleName is Asset {
    struct Record {
	address owner;
	string name;
	address walletAddress;
    }

    mapping(string => Record) records;  // Map an ID to the record

    modifier onlyOwner(string recordId) {
	if (records[recordId].owner != msg.sender) throw;
	_
    }

    function owner(string recordId) returns (address ownerAddress) {
	return records[recordId].owner;
    }

    function setOwner(string recordId, address newOwner) onlyOwner(recordId) {
	records[recordId].owner = newOwner;
    }

    function addName(string recordId, address owner, string name, address walletAddress) returns (bool sufficient) {
	if (records[recordId].owner != 0) {
	    // If a record with this name already exists
	    throw;
	}

	Record r = records[recordId];

	r.owner = owner;
	r.name = name;
	r.walletAddress = walletAddress;
	return true;
    }

    // Allow the owner to update the wallet address of the record
    function updateRecordWalletAddress(string _id, address _newWalletAddress) onlyOwner(_id) returns (bool success) {
	if (records[_id].owner == 0) {
	    // We don't know this record
	    throw;
	}

	records[_id].walletAddress = _newWalletAddress;
	return true;	
    }
}
