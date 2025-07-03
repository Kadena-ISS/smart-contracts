import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ba_account, getClientDatas, ua_account } from "../../utils/constants";
import { upgradeHypERC20Coll } from "./upgrade-warp-module";
import { toHex, walletActions } from "viem";
import {
  enrollRemoteRouter,
  getTokenHash,
  storeTokenToRouter,
} from "./deploy-warp-modules";
import { hexToBase64 } from "./warp-utils";
import { TxData } from "../../utils/interfaces";

// Upgrades a collateral route between KDA and EVM, where KDA router is a collateral token
// and EVM router is a synthetic. This script upgrade both sides, KDA and EVM.

export const upgradeCollateralWarpRoute = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  mailboxAddress: `0x${string}`,
  proxyAdminAddress: `0x${string}`,
  hypERC20Address: `0x${string}`,
  domainEVM: number,
  domainKDA: number,
  tokenSymbolKDA: string,
) => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);
  const clientDatas = getClientDatas(phase);

  const hypERC20 = await hre.viem.getContractAt("HypERC20", hypERC20Address);
  const tokenPrecisionKDA = await hypERC20.read.decimals();

  const hypERC20Impl = await hre.viem.deployContract(
    "HypERC20",
    [tokenPrecisionKDA, mailboxAddress],
    { walletClient },
  );
  const hypERC20Proxy = await hre.viem.getContractAt(
    "TransparentUpgradeableProxy",
    hypERC20Address,
  );
  const proxyAdmin = await hre.viem.getContractAt(
    "ProxyAdmin",
    proxyAdminAddress,
  );
  await proxyAdmin.write.upgrade([hypERC20Proxy.address, hypERC20Impl.address]);

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = upgradeHypERC20Coll(
      clientDatas[i],
      ba_account,
      ua_account,
      tokenSymbolKDA,
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
};
