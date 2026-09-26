import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    version: "0.8.34",
  },

  networks: {
    polygonAmoy: {
      type: "http",
      chainType: "generic",
      chainId: 80002,
      url: process.env.POLYGON_AMOY_RPC_URL!,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
});