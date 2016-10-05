// Abstract contract for a not yet agreed upon standard for non-fungible
// on chain goods

contract Asset {
    function owner(string recordId) returns (address ownerAddress);

    function setOwner(string recordId, address newOwner);    
}
