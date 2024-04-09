import {
  http,
  walletActions,
  getContract,
  createPublicClient,
  defineChain,
} from "viem";
import {
  StorageGasOracle__factory,
  InterchainGasPaymaster__factory,
  Mailbox__factory,
} from "@hyperlane-xyz/core";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { bridge_anvil, KADENA_DOMAIN } from "../../utils/constants";
import { readFile } from "fs/promises";
import { writeFileSync } from "fs";

export const configureETH = async (
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

export const mergeRoutesAndWrite = async (
  outputFilePath: string,
  routeObjects: object[]
) => {
  const file = await readFile(outputFilePath);
  const parsedJSON = JSON.parse(file.toString());
  for (const routeObj of routeObjects) {
    const tokenKey = Object.keys(routeObj)[0];
    const existingChains = parsedJSON[tokenKey];
    const newChain = Object.keys(Object.values(routeObj)[0])[0];
    if (Object.keys(existingChains).find((x) => x == newChain) == undefined) {
      const newObj = Object.values(routeObj)[0];
      parsedJSON[tokenKey] = { ...existingChains, ...newObj };
    }
  }
  writeFileSync(outputFilePath, parsedJSON, {
    flag: "w",
  });
};
