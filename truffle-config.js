module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    }
  }
};


//var mnemonic = "easily debate doll film raccoon scatter horse borrow rigid moon marble pride";
//module.exports = {
//  networks: {
  //    rinkeby: {
  //        provider: function() {
  //          return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/0xa2AF1C4e68532a3A6577B2960c5Bb7318D51F5F1")
  //        },
  //        network_id: 4
  //      }
  //    }
//};

//rinkeby: {
//  host: "localhost",
//  port: 8545,
//  network_id: "4",
//  from: "0xa2AF1C4e68532a3A6577B2960c5Bb7318D51F5F1",
//  gas: 100000
//}
