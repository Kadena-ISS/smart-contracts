import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

import "./scripts/deployments/warp/tasks/deploy-warp-route.ts";
import "./scripts/deployments/warp/tasks/deploy-warp-testnet.ts";

import dotenv from "dotenv";
dotenv.config();

const privateKey = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
      url: "http://anvil:8545",
      accounts: [privateKey],
    },
    sepolia: {
      url: "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: [privateKey],
    },
    moonbaseAlpha: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: [privateKey],
    },
    polygonMumbai: {
      url: "https://rpc.ankr.com/polygon_mumbai",
      chainId: 80001,
      accounts: [privateKey],
    },
  },
};

export default config;
