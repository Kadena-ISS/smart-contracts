import { toHex, walletActions } from "viem";
import { ba_account, getClientDatas, ua_account } from "../../utils/constants";
import { upgradeHypERC20Synth } from "./upgrade-warp-module";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  enrollRemoteRouter,
  getTokenHash,
  storeTokenToRouter,
} from "./deploy-warp-modules";
import { hexToBase64 } from "./warp-utils";
import { TxData } from "../../utils/interfaces";

// Upgrades a native route between EVM and KDA, where EVM router is a native token
// and KDA router is a synthetic. This script upgrades both sides, EVM and KDA.

export const upgradeNativeWarpRoute = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  mailboxAddress: `0x${string}`,
  proxyAdminAddress: `0x${string}`,
  hypNativeAddress: `0x${string}`,
  domainEVM: number,
  domainKDA: number,
  tokenSymbolEVM: string,
  tokenDecimalsEVM: number,
) => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);
  const clientDatas = getClientDatas(phase);

  const tokenSymbolKDA = `kb-${tokenSymbolEVM}`;

  const hypNative = await hre.viem.getContractAt("HypNative", hypNativeAddress);

  const hypNativeImpl = await hre.viem.deployContract(
    "HypNative",
    [mailboxAddress],
    { walletClient },
  );
  const hypNativeProxy = await hre.viem.getContractAt(
    "TransparentUpgradeableProxy",
    hypNativeAddress,
  );
  const proxyAdmin = await hre.viem.getContractAt(
    "ProxyAdmin",
    proxyAdminAddress,
  );
  await proxyAdmin.write.upgrade([
    hypNativeProxy.address,
    hypNativeImpl.address,
  ]);

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = upgradeHypERC20Synth(
      clientDatas[i],
      ba_account,
      ua_account,
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
};
