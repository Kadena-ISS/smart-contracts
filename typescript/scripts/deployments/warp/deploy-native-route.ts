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

// Deploys a native route between EVM and KDA, where EVM router is a native token
// and KDA router is a synthetic. This script deploys both sides, EVM and KDA.

export const deployNativeWarpRoute = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  igpAddress: `0x${string}`,
  ismAddress: `0x${string}`,
  mailboxAddress: `0x${string}`,
  proxyAdminAddress: `0x${string}`,
  domainEVM: number,
  domainKDA: number,
  tokenSymbolEVM: string,
  tokenDecimalsEVM: number,
): Promise<IRoute> => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);
  const clientDatas = getClientDatas(phase);

  const tokenSymbolKDA = `kb-${tokenSymbolEVM}`;

  const hypNativeImpl = await hre.viem.deployContract(
    "HypNative",
    [mailboxAddress],
    { walletClient },
  );
  const hypNativeProxy = await hre.viem.deployContract(
    "TransparentUpgradeableProxy" as string,
    [hypNativeImpl.address, proxyAdminAddress, ""],
    { walletClient },
  );
  const hypNative = await hre.viem.getContractAt(
    "HypNative",
    hypNativeProxy.address,
  );
  await hypNative.write.initialize([
    igpAddress,
    ismAddress,
    deployer.account.address,
  ]);
  await hypNative.write.setMaxKadenaChainId([MAX_KDA_CHAIN]);

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = deployHypERC20Synth(
      clientDatas[i],
      ba_account,
      ba_account,
      tokenSymbolKDA,
      tokenDecimalsEVM,
    );
  }
  await Promise.all(promises);

  const routerKDA = (
    (await getTokenHash(clientDatas[0], tokenSymbolKDA)) as unknown as TxData
  ).data;
  const routerEVM = hexToBase64(
    "0x000000000000000000000000" + hypNative.address.slice(2),
  );

  await delay(60000);

  await Promise.all([
    hypNative.write.enrollRemoteRouter([domainKDA, toHex(routerKDA)]),
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
      address: hypNative.address,
      symbol: tokenSymbolEVM as string,
      type: TokenType.Native,
    },
    [domainKDA]: {
      address: `${NAMESPACES[phase as keyof IDomains]}.${tokenSymbolKDA}`,
      symbol: tokenSymbolKDA,
      type: TokenType.Synthetic,
    },
  };
};
