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
  KADENA_DOMAIN1,
  b_account,
  clientData,
  clientData_1,
} from "../utils/constants";
import {
  getRouterHash,
  storeRouterToMailbox,
  enrollRemoteRouter,
  deployHypERC20Synth,
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

  for (let i = 0; i < 20; ++i) {
    const remoteGasDataConfig = {
      remoteDomain: KADENA_DOMAIN + i,
      tokenExchangeRate,
      gasPrice,
    };
    await gasOracle.write.setRemoteGasData([remoteGasDataConfig], {
      account: deployer.account,
    });

    const igpConfig = {
      remoteDomain: KADENA_DOMAIN + i,
      config: {
        gasOracle: oracleAddress,
        gasOverhead: 0n,
      },
    };
    await igp.write.setDestinationGasConfigs([[igpConfig]], {
      account: deployer.account,
    });
  }

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
    const [deployer] = await hre.viem.getWalletClients();

    const walletClient = deployer.extend(walletActions);

    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString()).anvil;

    const oracleAddress: `0x${string}` = parsedJSON.storageGasOracle;
    const igpAddress: `0x${string}` = parsedJSON.interchainGasPaymaster;
    const mailboxAddress: `0x${string}` = parsedJSON.mailbox;
    await configureETH(hre, oracleAddress, igpAddress, mailboxAddress);

    const erc20ETH = await hre.viem.deployContract(
      "TestERC20",
      [18, mailboxAddress],
      { walletClient }
    );

    await erc20ETH.write.initialize([
      parseEther("500"),
      "HYPERC20",
      "HYPERC20",
    ]);

    await writeFile(taskArgs.outputFile, erc20ETH.address);
    console.log(erc20ETH.address);

    const syntheticTokenName = "hyp-erc20";

    await deployHypERC20Synth(clientData, b_account, syntheticTokenName);
    await deployHypERC20Synth(clientData_1, b_account, syntheticTokenName);

    const kadena_router = (await getRouterHash(clientData, syntheticTokenName))
      .data;

    await storeRouterToMailbox(clientData, b_account, syntheticTokenName);

    const eth_router = erc20ETH.address;
    await erc20ETH.write.enrollRemoteRouter([
      KADENA_DOMAIN,
      toHex(kadena_router),
    ]);
    await erc20ETH.write.enrollRemoteRouter([
      KADENA_DOMAIN1,
      toHex(kadena_router),
    ]);
    await enrollRemoteRouter(clientData, b_account, "31337", eth_router);
  });
