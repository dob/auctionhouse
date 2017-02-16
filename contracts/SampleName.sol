pragma solidity ^0.4.2;

// Sample implementation of a non fungible asset, which is a name resolved to
// an ethereum wallet address

import "./Asset.sol";

contract SampleName is Asset {
    struct Record {
        address owner;
        string name;
        address walletAddress;
    }

    mapping(string => Record) records;  // Map an ID to the record

    modifier onlyOwner(string _recordId) {
        if (records[_recordId].owner != msg.sender) throw;
        _;
    }

    function owner(string _recordId) returns (address ownerAddress) {
        return records[_recordId].owner;
    }

    function setOwner(string _recordId, address _newOwner) onlyOwner(_recordId) returns (bool success) {
        records[_recordId].owner = _newOwner;
        return true;
    }

    function addRecord(string _recordId, address _owner, string _name, address _walletAddress) returns (bool sufficient) {
        if (records[_recordId].owner != 0) {
            // If a record with this name already exists
            return false;
        }

        Record r = records[_recordId];

        r.owner = _owner;
        r.name = _name;
        r.walletAddress = _walletAddress;
        return true;
    }

    function getWalletAddress(string _recordId) returns (address walletAddress) {
        return records[_recordId].walletAddress;
    }

    // Allow the owner to update the wallet address of the record
    function updateRecordWalletAddress(string _recordId, address _newWalletAddress) onlyOwner(_recordId) returns (bool success) {
        if (records[_recordId].owner == 0) {
            // We don't know this record
            return false;
        }

        records[_recordId].walletAddress = _newWalletAddress;
        return true;	
    }
}
