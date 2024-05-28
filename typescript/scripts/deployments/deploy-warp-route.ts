import {
  http,
  walletActions,
  getContract,
  createPublicClient,
  defineChain,
} from "viem";
import { task } from "hardhat/config";
import { readFile } from "fs/promises";

import {
  InterchainGasPaymaster__factory,
  Mailbox__factory,
  StorageGasOracle__factory,
} from "@hyperlane-xyz/core";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ANVIL_URL, KADENA_DOMAIN } from "../utils/constants";
import { configureCollateralWarpRoute } from "./cfg-col-route";
import { configureSyntheticWarpRoute } from "./cfg-synthetic-route";
import { writeFileSync } from "fs";
import { join } from "path";

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

const configureETH = async (
  hre: HardhatRuntimeEnvironment,
  oracleAddress: `0x${string}`,
  igpAddress: `0x${string}`,
  mailboxAddress: `0x${string}`
) => {
  const [deployer] = await hre.viem.getWalletClients();

  const publicClient = createPublicClient({
    chain: bridge_anvil,
    transport: http(),
  });

  const walletClient = deployer.extend(walletActions);

  const gasOracle = getContract({
    address: oracleAddress,
    abi: StorageGasOracle__factory.abi,
    publicClient,
    walletClient,
  });

  const tokenExchangeRate = 1n;
  const gasPrice = 1n;

  const igp = getContract({
    address: igpAddress,
    abi: InterchainGasPaymaster__factory.abi,
    publicClient,
    walletClient,
  });

  const remoteGasDataConfig = {
    remoteDomain: KADENA_DOMAIN,
    tokenExchangeRate,
    gasPrice,
  };
  await gasOracle.write.setRemoteGasData([remoteGasDataConfig], {
    account: deployer.account,
  });

  const igpConfig = {
    remoteDomain: KADENA_DOMAIN,
    config: {
      gasOracle: oracleAddress,
      gasOverhead: 0n,
    },
  };
  await igp.write.setDestinationGasConfigs([[igpConfig]], {
    account: deployer.account,
  });

  const noopIsm = await hre.viem.deployContract("NoopIsm");

  const mailbox = getContract({
    address: mailboxAddress,
    abi: Mailbox__factory.abi,
    publicClient,
    walletClient,
  });

  await mailbox.write.setDefaultIsm([noopIsm.address]);
};

task("warp", "Deploys Warp Route")
  .addPositionalParam("inputFile")
  .addPositionalParam("outputFile")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying Warp Route");
    const [deployer] = await hre.viem.getWalletClients();

    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString()).anvil;

    console.log("Configuring ETH");
    const oracleAddress: `0x${string}` = parsedJSON.storageGasOracle;
    const igpAddress: `0x${string}` = parsedJSON.interchainGasPaymaster;
    const mailboxAddress: `0x${string}` = parsedJSON.mailbox;
    await configureETH(hre, oracleAddress, igpAddress, mailboxAddress);

    const synRouteResult = await configureSyntheticWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "kbWETHA",
      "kb-WETHA"
    );
    console.log(synRouteResult);

    const collateralRouteResult = await configureCollateralWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "kbKDA",
      "kb-KDA",
      "coin"
    );
    console.log(collateralRouteResult);
    const result = JSON.stringify({
      ETH: synRouteResult,
      KDA: collateralRouteResult,
    });
    writeFileSync(taskArgs.outputFile, result, {
      flag: "w",
    });
  });
