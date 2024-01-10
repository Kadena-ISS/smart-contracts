import {
  http,
  parseEther,
  walletActions,
  getContract,
  createPublicClient,
  defineChain,
} from "viem";

import {
  InterchainGasPaymaster__factory, 
  StorageGasOracle__factory,
} from "@hyperlane-xyz/core";
import { task } from "hardhat/config";
import { readFile } from "fs/promises";
import { createClient } from "@kadena/client";
import { b_account } from "../kadena/deploy-bridge";
import { deployHypERC20 } from "../kadena/deploy-modules";

const ANVIL_URL = "http://127.0.0.1:8545";
const devnet_url = `http://localhost:8080/chainweb/0.0/fast-development/chain/0/pact`;

export const bridge_anvil = defineChain({
  id: 31337,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [ANVIL_URL],
    },
    public: {
      http: [ANVIL_URL],
    },
  },
  network: "31337",
});

const client = createClient(devnet_url);

task("warp", "deploys warp")
  .addPositionalParam("fileLocation")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.viem.getWalletClients();
    console.log(deployer.account.address);

    const publicClient = createPublicClient({
      chain: bridge_anvil,
      transport: http(),
    });

    const walletClient = deployer.extend(walletActions);

    const file = await readFile(taskArgs.fileLocation);
    const parsedJSON = JSON.parse(file.toString()).anvil;
    console.log(parsedJSON);

    const mailboxAddress: `0x${string}` = parsedJSON.mailbox;
    const oracleAddress: `0x${string}` = parsedJSON.storageGasOracle;
    const igpAddress: `0x${string}` = parsedJSON.interchainGasPaymaster;

    const hyperc20 = await hre.viem.deployContract("TestERC20", [
      18,
      mailboxAddress,
    ], {walletClient});

    await deployHypERC20(client, b_account, hyperc20.address);
    console.log(hyperc20.address);

    const gasOracle = getContract({
      address: oracleAddress,
      abi: StorageGasOracle__factory.abi,
      publicClient,
      walletClient,
    });

    const igp = getContract({
      address: igpAddress,
      abi: InterchainGasPaymaster__factory.abi,
      publicClient,
      walletClient,
    });

    const remoteDomain = 626;
    const tokenExchangeRate = 1n;
    const gasPrice = 1n;
    const remoteGasDataConfig = {remoteDomain, tokenExchangeRate, gasPrice};
    await gasOracle.write.setRemoteGasData([remoteGasDataConfig], {account: deployer.account});

    const igpConfig = {
      remoteDomain, config: {
        gasOracle: oracleAddress,
        gasOverhead: 0n
      }
    };
    await igp.write.setDestinationGasConfigs([[igpConfig]], {account: deployer.account})

    const gasPayment = await hyperc20.read.quoteGasPayment([remoteDomain]);
    console.log("Quote gas payment: ", gasPayment);
    await hyperc20.write.initialize(
      [parseEther("1500"), "HYPERC20", "HYPERC20"],
      { account: deployer.account }
    );
    console.log(await hyperc20.read.balanceOf([deployer.account.address]));
    await hyperc20.write.transferRemote([remoteDomain, "alice", gasPayment], {
      account: deployer.account,
      value: gasPayment,
    });
    console.log(await hyperc20.read.balanceOf([deployer.account.address]));
  });
