import { walletActions, toHex } from "viem";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  ba_account,
  getClientDatas,
  MAX_KDA_CHAIN,
  NAMESPACES,
} from "../../utils/constants";
import {
  getTokenHash,
  storeTokenToRouter,
  enrollRemoteRouter,
  deployHypERC20Synth,
} from "./deploy-warp-modules";
import { IDomains, IRoute, TokenType, TxData } from "../../utils/interfaces";
import { hexToBase64 } from "./warp-utils";
import delay from "delay";

// Deploys a synthetic route between EVM and KDA, where EVM router is a collateral token
// and KDA router is a synthetic. This script deploys both sides, EVM and KDA.

export const deploySyntheticWarpRoute = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  igpAddress: `0x${string}`,
  ismAddress: `0x${string}`,
  mailboxAddress: `0x${string}`,
  proxyAdminAddress: `0x${string}`,
  domainEVM: number,
  domainKDA: number,
  tokenAddressEVM: `0x${string}`,
): Promise<IRoute> => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);
  const clientDatas = getClientDatas(phase);

  const erc20Collateral = await hre.viem.getContractAt(
    "ERC20Collateral" as string,
    tokenAddressEVM,
  );
  const tokenSymbolEVM = await erc20Collateral.read.symbol();
  const tokenSymbolKDA = `kb-${tokenSymbolEVM}`;

  const hypERC20CollateralImpl = await hre.viem.deployContract(
    "HypERC20Collateral",
    [tokenAddressEVM, mailboxAddress],
    { walletClient },
  );
  const hypERC20CollateralProxy = await hre.viem.deployContract(
    "TransparentUpgradeableProxy" as string,
    [hypERC20CollateralImpl.address, proxyAdminAddress, ""],
    { walletClient },
  );
  const hypERC20Collateral = await hre.viem.getContractAt(
    "HypERC20Collateral",
    hypERC20CollateralProxy.address,
  );
  await hypERC20Collateral.write.initialize([
    igpAddress,
    ismAddress,
    deployer.account.address,
  ]);
  await hypERC20Collateral.write.setMaxKadenaChainId([MAX_KDA_CHAIN]);

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = deployHypERC20Synth(
      clientDatas[i],
      ba_account,
      ba_account,
      tokenSymbolKDA,
      (await erc20Collateral.read.decimals()) as number,
    );
  }
  await Promise.all(promises);

  const routerKDA = (
    (await getTokenHash(clientDatas[0], tokenSymbolKDA)) as unknown as TxData
  ).data;
  const routerEVM = hexToBase64(
    "0x000000000000000000000000" + hypERC20Collateral.address.slice(2),
  );

  await delay(60000);

  await Promise.all([
    hypERC20Collateral.write.enrollRemoteRouter([domainKDA, toHex(routerKDA)]),
    storeTokenToRouter(clientDatas[0], ba_account, ba_account, tokenSymbolKDA),
    enrollRemoteRouter(
      clientDatas[0],
      ba_account,
      ba_account,
      tokenSymbolKDA,
      domainEVM,
      routerEVM,
    ),
  ]);

  return {
    [domainEVM]: {
      address: hypERC20Collateral.address,
      symbol: tokenSymbolEVM as string,
      type: TokenType.Collateral,
    },
    [domainKDA]: {
      address: `${NAMESPACES[phase as keyof IDomains]}.${tokenSymbolKDA}`,
      symbol: tokenSymbolKDA,
      type: TokenType.Synthetic,
    },
  };
};
