module.exports = {
  build: {
    "index.html": "index.html",
    "auction.html": "auction.html",
    "header.html": "header.html",
    "footer.html": "footer.html",
    "createAuction.html": "createAuction.html",
    "app.js": [
      "javascripts/app.js",
    ],
    "auction.js": [
      "javascripts/auction.js"
    ],
    "createAuction.js": [
      "javascripts/createAuction.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "images/": "images/"
  },
  rpc: {
    host: "localhost",
    // port: 8081
    port: 8545
  }
};
