import {
  http,
  walletActions,
  getContract,
  createPublicClient,
  defineChain,
  keccak256,
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
  deployHypERC20,
  enrollRemoteRouter,
  fundAccountERC20,
  getRouterHash,
  registerAccountWithERC20,
  storeRouterToMailbox,
} from "./deploy-modules";
import { b_account, client, f_user, s_user, t_user } from "./utils/constants";

const KADENA_DOMAIN = 626;

const ANVIL_URL = "http://anvil:8545";
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
  const remoteGasDataConfig = {
    remoteDomain: KADENA_DOMAIN,
    tokenExchangeRate,
    gasPrice,
  };
  await gasOracle.write.setRemoteGasData([remoteGasDataConfig], {
    account: deployer.account,
  });

  const igp = getContract({
    address: igpAddress,
    abi: InterchainGasPaymaster__factory.abi,
    publicClient,
    walletClient,
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
    const [deployer] = await hre.viem.getWalletClients();

    const walletClient = deployer.extend(walletActions);

    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString()).anvil1;

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

    await deployHypERC20(client, b_account);
    const kadena_router = (await getRouterHash(client)).data;

    await storeRouterToMailbox(client, b_account);

    const eth_router = "0x000000000000000000000000".concat(
      erc20ETH.address.slice(2)
    );
    await erc20ETH.write.enrollRemoteRouter([
      KADENA_DOMAIN,
      toHex(kadena_router),
    ]);
    await enrollRemoteRouter(client, b_account, "31337", eth_router);

    //TODO: apply transfer-create
    await registerAccountWithERC20(client, f_user);
    await registerAccountWithERC20(client, s_user);
    await registerAccountWithERC20(client, t_user);

    await fundAccountERC20(client, f_user);
    await fundAccountERC20(client, s_user);
    await fundAccountERC20(client, t_user);
  });
