module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: process.env.GANACHE_PORT ? parseInt(process.env.GANACHE_PORT, 10) : 7546,
      network_id: "*"
    },
    ganache_7546: {
      host: "127.0.0.1",
      port: 7546,
      network_id: "*"
    },
    ganache_gui: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ganache_cli: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    ganache_1337: {
      host: "127.0.0.1",
      port: 1337,
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        evmVersion: "paris",
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};
  