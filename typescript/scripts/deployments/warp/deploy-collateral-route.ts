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
  deployHypERC20Coll,
} from "./deploy-warp-modules";
import { IDomains, IRoute, TokenType, TxData } from "../../utils/interfaces";
import { hexToBase64 } from "./warp-utils";
import delay from "delay";

// Deploys a collateral route between KDA and EVM, where KDA router is a collateral token
// and EVM router is a synthetic. This script deploys both sides, KDA and EVM.

export const deployCollateralWarpRoute = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  igpAddress: `0x${string}`,
  ismAddress: `0x${string}`,
  mailboxAddress: `0x${string}`,
  proxyAdminAddress: `0x${string}`,
  domainEVM: number,
  domainKDA: number,
  tokenSymbolKDA: string,
  tokenNameKDA: string,
  tokenPrecisionKDA: number,
): Promise<IRoute> => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);
  const clientDatas = getClientDatas(phase);

  const tokenSymbolEVM = `kb-${tokenSymbolKDA}`;

  const hypERC20Impl = await hre.viem.deployContract(
    "HypERC20",
    [tokenPrecisionKDA, mailboxAddress],
    { walletClient },
  );
  const hypERC20Proxy = await hre.viem.deployContract(
    "TransparentUpgradeableProxy" as string,
    [hypERC20Impl.address, proxyAdminAddress, ""],
    { walletClient },
  );
  const hypERC20 = await hre.viem.getContractAt(
    "HypERC20",
    hypERC20Proxy.address,
  );
  await hypERC20.write.initialize([
    tokenSymbolEVM,
    tokenSymbolEVM,
    igpAddress,
    ismAddress,
    deployer.account.address,
  ]);
  await hypERC20.write.setMaxKadenaChainId([MAX_KDA_CHAIN]);

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = deployHypERC20Coll(
      clientDatas[i],
      ba_account,
      ba_account,
      tokenSymbolKDA,
      tokenNameKDA,
      tokenPrecisionKDA,
    );
  }
  await Promise.all(promises);

  const routerKDA = (
    (await getTokenHash(clientDatas[0], tokenSymbolKDA)) as unknown as TxData
  ).data;
  const routerEVM = hexToBase64(
    "0x000000000000000000000000" + hypERC20.address.slice(2),
  );

  await delay(60000);

  await Promise.all([
    hypERC20.write.enrollRemoteRouter([domainKDA, toHex(routerKDA)]),
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
      address: hypERC20.address,
      symbol: tokenSymbolEVM as string,
      type: TokenType.Synthetic,
    },
    [domainKDA]: {
      address: `${NAMESPACES[phase as keyof IDomains]}.${tokenSymbolKDA}`,
      symbol: tokenSymbolKDA,
      type: TokenType.Collateral,
    },
  };
};
