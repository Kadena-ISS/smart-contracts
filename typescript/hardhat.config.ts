import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

import "./scripts/deploy.ts";

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
      url: "http://127.0.0.1:8545",
      accounts: [
        "78c171ee07a367fe1edcdb0a47abb5f37fe566e10516494217b0bbab2b7d4584",
      ],
    },
  },
};

export default config;
