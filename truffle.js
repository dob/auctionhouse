module.exports = {
  build: {
    "index.html": "index.html",
    "auction.html": "auction.html",
    "header.html": "header.html",
      "footer.html": "footer.html",
      "rightPanel.html": "rightPanel.html",
    "createAuction.html": "createAuction.html",
    "about.html": "about.html",
    "app.js": [
      "javascripts/app.js",
    ],
    "auctionhouse.js": [
      "javascripts/auctionhouse.js"
    ],
    "network.js": [
      "javascripts/network.js"
    ],
    "auction.js": [
      "javascripts/auction.js"
    ],
    "createAuction.js": [
      "javascripts/createAuction.js"
    ],
    "jquery.min.js": [
      "javascripts/jquery.min.js"
    ],
    "bootstrap.min.js": [
      "javascripts/bootstrap.min.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "bootstrap.min.css": [
      "stylesheets/bootstrap.min.css"
    ],
    "bootstrap-theme.min.css": [
      "stylesheets/bootstrap-theme.min.css"
    ],
    "images/": "images/"
  },
  rpc: {
    host: "localhost",
    // port: 8081
    port: 8545
  },
  networs: {
    "development": {
      network_id: "default"
    },
    "modern": {
      network_id: 2,
      gas: 500000
    },
    "live": {
      network_id: 1
    }
  }
};
