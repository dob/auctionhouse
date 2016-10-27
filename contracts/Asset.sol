pragma solidity ^0.4.2;

// Abstract contract for a not yet agreed upon standard for non-fungible
// on chain goods

contract Asset {
    function owner(string _recordId) returns (address ownerAddress);

    function setOwner(string _recordId, address _newOwner) returns (bool success);    
}
