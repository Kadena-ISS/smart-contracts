import {
  http,
  walletActions,
  getContract,
  createPublicClient,
  defineChain,
  toHex,
  parseEther,
} from "viem";
import { task } from "hardhat/config";
import { readFile, writeFile } from "fs/promises";

import {
  InterchainGasPaymaster__factory,
  Mailbox__factory,
  StorageGasOracle__factory,
} from "@hyperlane-xyz/core";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import {
  ANVIL_URL,
  KADENA_DOMAIN,
  b_account,
  clientData,
  clientData_1,
  f_user,
} from "../utils/constants";
import {
  getRouterHash,
  storeRouterToMailbox,
  enrollRemoteRouter,
  deployHypERC20Synth,
  fundAccountERC20,
} from "./deploy-warp-modules";

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

const configureSyntheticWarpRoute = async (
  hre: HardhatRuntimeEnvironment,
  mailboxAddress: `0x${string}`,
  tokenNameETH: string,
  tokenNameKDA: string
) => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);

  console.log("Deploying ETH Router");
  const erc20ETH = await hre.viem.deployContract(
    "TestERC20",
    [18, mailboxAddress],
    { walletClient }
  );

  await erc20ETH.write.initialize([
    parseEther("500"),
    tokenNameETH,
    tokenNameETH,
  ]);

  //todo: deploy to all chains
  await Promise.all([
    deployHypERC20Synth(clientData, b_account, tokenNameKDA),
    deployHypERC20Synth(clientData_1, b_account, tokenNameKDA),
  ]);

  const kadena_router = (await getRouterHash(clientData, tokenNameKDA)).data;

  await storeRouterToMailbox(clientData, b_account, tokenNameKDA);

  const eth_router = erc20ETH.address;
  await erc20ETH.write.enrollRemoteRouter([
    KADENA_DOMAIN,
    toHex(kadena_router),
  ]);

  await Promise.all([
    enrollRemoteRouter(clientData, b_account, "31337", eth_router),
    fundAccountERC20(clientData, b_account, tokenNameKDA, f_user),
  ]);

  return {
    eth: { address: eth_router, type: "synthetic" },
    kda: { address: tokenNameKDA, type: "collateral" },
  };
};

const configureCollateralWarpRoute = async (
  hre: HardhatRuntimeEnvironment,
  mailboxAddress: `0x${string}`,
  tokenNameETH: string,
  tokenNameKDA: string,
  collateralNameKda: string
) => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);

  const erc20ETH = await hre.viem.deployContract(
    "TestERC20",
    [18, mailboxAddress],
    { walletClient }
  );

  await erc20ETH.write.initialize([parseEther("500"), "HYPERC20", "HYPERC20"]);

  //todo: deploy to all chains

  await deployHypERC20Synth(clientData, b_account, tokenName);
  await deployHypERC20Synth(clientData_1, b_account, tokenName);

  const kadena_router = (await getRouterHash(clientData, tokenName)).data;

  await storeRouterToMailbox(clientData, b_account, tokenName);

  const eth_router = erc20ETH.address;
  await erc20ETH.write.enrollRemoteRouter([
    KADENA_DOMAIN,
    toHex(kadena_router),
  ]);

  await enrollRemoteRouter(clientData, b_account, "31337", eth_router);
  await fundAccountERC20(clientData, b_account, tokenName, f_user);

  return {
    eth: { address: eth_router, type: "synthetic" },
    kda: { address: tokenName, type: "collateral" },
  };
};

task("warp", "Deploys Warp Route")
  .addPositionalParam("inputFile")
  .addPositionalParam("outputFile")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying Warp Route");
    const [deployer] = await hre.viem.getWalletClients();

    const walletClient = deployer.extend(walletActions);

    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString()).anvil;

    console.log("Configuring ETH");
    const oracleAddress: `0x${string}` = parsedJSON.storageGasOracle;
    const igpAddress: `0x${string}` = parsedJSON.interchainGasPaymaster;
    const mailboxAddress: `0x${string}` = parsedJSON.mailbox;
    await configureETH(hre, oracleAddress, igpAddress, mailboxAddress);

    const warpRouteResult = await configureSyntheticWarpRoute(
      hre,
      mailboxAddress,
      "HYPERC20",
      "hyp-erc20"
    );
    console.log(warpRouteResult);
  });
