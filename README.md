# Auctionhouse project

This is a platform for auctioning non fungible on chain goods. The below are work in progress notes that we can update and point to as we develop the project.

## Protocol

Implement an on chain set of smart contracts to govern auctions for non-fungible on chain goods. If someone wants to auction off a specific token which either doesn’t have liquidity on an exchange, or is unique, or is representative of some power or job in a network, then they can do so via the auctionhouse platform. The platform will allow the seller to:

- Create an auction
- Declare the asset for sale (to be held in escrow via the auctionhouse contract)
- Set a duration for the auction
- Set an initial price
- Set a reserve price
- Set a buy-it-now price
- Cancel the auction (in the first X minutes or if the reserve has not been met)

It will allow bidding from other users

- Place a bid for a certain amount

It will facilitate the transfer of the asset

- When auction starts the token gets placed in escrow
- When auction ends if the buy-it-now price is hit, or the time runs out, it will transfer the token to the appropriate person - top bidder if reserve is hit, or back to the owner if the reserve is not hit.
- If auction is cancelled then the asset transfers back to the owner

It will provide for a distribution incentive

- Set a percentage cut for the distribution platform (optional, or can be 0 percent). This is created by the seller upon creation of the auction. It acts as an incentive for a specific platform to promote and feature this auction. Since many auctions will be created by using a platform, that platform will likely be creating the auction on behalf of the user and therefore they’ll set this percentage cut for themselves each time (at say 5%).
- Set a percentage cut to be paid to the platform that generates the winning bid (optional, or can be 0%). This is an alternative to the seller setting the reward cut platform, and instead the reward cut will go to the platform that submits the winning bid. Perhaps both of these should exist in the protocol and we need to think about how they would be gamed.

## Use Cases

This is meant to facilitate auctioning off any non-fungible *on-chain* asset. Anything represented by an interfaced non-fungible asset (not ERC20, but need to find equivalent...ERC-137 is for name registries and may be close?) token can be auctioned.

- Auction a name on the Ethereum Name Service
- Auction off an on-chain virtual good (a digital baseball card or a token that represents ownership over a powerful sword in a blockchain backed RPG)
- Auction off a real world good that’s represented by a token on the blockchain (a concert ticket, or a futures contract)
- Auction off a block of on chain assets that would be difficult to sell all at once on an exchange (10% of all REP tokens).
- Auction off a token that entitles one to a role in an on-chain economy (a board membership token in a DAO, who has power to whitelist proposals)
- Auction off ownership of an account in a service (user in a game is represented by a token...transfer the token)

## Technical Standard For Auctionable Items

As mentioned above, there needs to be some convention by which items are made available to be auctioned on this platform. My current thinking is to follow the inspiration of ERC20, which describes fungible tokens and provides methods to find out an owner's balance, the transfer the token, and to allow others to transfer the token on your behalf up to a certain amount.

In the case of non-fungible assets, there is no concept of "balance", as each item is unique. Generally, a token is represented by an ID, and some associated metadata. An example (inspired from ERC137 which describes name records)...


```javascript
contract NonFungible {
     struct Record {
          address owner;
          /* arbitrary metadata fields go here */
     }

     mapping(bytes32 => Record) records;    // Map an ID to the record

     modifier onlyOwner(bytes32 recordId) {
          if (records[recordId].owner != msg.sender) throw;
          _
     }

     function owner(bytes32 recordId) constant returns address {
          return records[recordId].owner;
     }

     function setOwner(bytes32 recordId, address newOwner) only_owner(recordId) {
          records[recordId].owner = newOwner;
     }
}
```

In this example each record has an owner identified by an address. There is a function for changing the owner, that only the current owner can call. This would facilitate the auction contract to set the owner as the auction contract during the create auction call (which would be initially called by the current owner). It would allow the auction contract itself to set the owner back to the original owner in the case of a failed auction, and to the new owner in the case of a successful one.

## Dapp Frontend

This protocol is truly decentralized, requiring no authoritative central party, so it can exist entirely on chain via transactions. This means that many different types of frontends are possible. Initially, we would probably provide a centralized auction site, that communicates with a hosted central node on behalf of it's users....

However, since the users will be the ones in posession of Eth or auctioned items, they will need to sign transactions initiative auctions or bids. This means that even the centralized site will need to allow them to generate transactions, via Metamask or direct RPC calls to their locally running nodes.

This also means that despite the site being deployed centrally initially, it should be made available as a standalone dapp, that anyone can run locally without talking to a central server and potentially even without an internet connection. So an appropriate order of events for dapp development may be:

- Build a centralized auction site that uses Metamask to submit transactions.
- Make sure that there are instructions for distributed and running it locally.
- Support an electron style standalone download

At the minimum, this app should probably provide the following functionality:

- Display all currently running auctions
- Display one specific auction
- Allow a user to create/publish an auction
- Allow a user to bid on an auction

Of course there are all sorts of frontend enhancements that can be built including indexing, search, additional metadata, featured listings, categories, etc, but I see these as interesting at the feature/business level and not necessarily the minimum viable features required to support the protocol.

---

### Questions

If a contract is an owner of an asset, then can a contract call an onlyOwner function, or would the sender of a message be the person who initiated that transaction within the contract?

tx.origin is the user who initiated the call, and msg.sender is the last person in the chain who made the call, so it would be the contract. In the case of starting an auction, the user would have to grant permission to the contract to transfer ownership of the asset.




###Local Test Procedure
1. Create local chain: `geth --identity "ericnode" --rpc --rpcport "8081" --rpccorsdomain "*" --datadir ./chaindata --port "30303" --nodiscover --rpcapi "db,eth,net,web3" --networkid 1999 init ./CustomGenesis.json` (create chaindata dir, then create CustomGenesis.json - http://ethdocs.org/en/latest/network/test-networks.html)
2. Launch console: `geth --identity "ericnode" --rpc --rpcport "8081" --rpccorsdomain "*" --datadir ./chaindata --port "30303" --nodiscover --rpcapi "db,eth,net,web3" --networkid 1999 console`
3. Create new account: `personal.newAccount("password")`
4. Mine some ether: miner.setEtherbase(personal.listAccounts[0]); miner.start()
5. Make sure miner is running when deploying to testnet
6. Deploy contracts by running: truffle migrate
7. Unlock account0: `personal.unlockAccount(eth.accounts[0], "password")`
8. Run simple test: `truffle test test/Simple.js`

-----

Note from Doug...I changed the launch command a bit to

`./geth --identity "ericnode" --rpc --rpcport "8545" --rpccorsdomain "chrome-extension://idknbmbdnapjicclomlijcgfpikmndhd" --datadir ~/.chaindata/ --port "30303" --rpcapi "db,eth,net,web3,personal" --networkid 1999 console`
