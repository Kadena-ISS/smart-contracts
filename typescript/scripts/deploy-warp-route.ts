import {
  http,
  walletActions,
  getContract,
  createPublicClient,
  defineChain,
} from "viem";
import { task } from "hardhat/config";
import { readFile, writeFile } from "fs/promises";

import {
  InterchainGasPaymaster__factory,
  StorageGasOracle__factory,
} from "@hyperlane-xyz/core";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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
  igpAddress: `0x${string}`
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
};

task("warp", "Deploys Warp Route")
  .addPositionalParam("fileLocation")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.viem.getWalletClients();
    console.log(deployer.account.address);

    const walletClient = deployer.extend(walletActions);

    const file = await readFile(taskArgs.fileLocation);
    const parsedJSON = JSON.parse(file.toString()).anvil1;

    const oracleAddress: `0x${string}` = parsedJSON.storageGasOracle;
    const igpAddress: `0x${string}` = parsedJSON.interchainGasPaymaster;
    const mailboxAddress: `0x${string}` = parsedJSON.mailbox;

    await configureETH(hre, oracleAddress, igpAddress);

    const hyperc20 = await hre.viem.deployContract(
      "TestERC20",
      [18, mailboxAddress],
      { walletClient }
    );

    await writeFile("ERC20.txt", hyperc20.address);
    console.log(hyperc20.address);
  });
