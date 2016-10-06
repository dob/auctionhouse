module.exports = function(deployer) {
    deployer.deploy(SampleName)
    deployer.autolink();
    deployer.deploy(AuctionHouse)
};
