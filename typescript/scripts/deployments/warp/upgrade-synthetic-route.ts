import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ba_account, getClientDatas, ua_account } from "../../utils/constants";
import { upgradeHypERC20Synth } from "./upgrade-warp-module";
import { toHex, walletActions } from "viem";
import {
  enrollRemoteRouter,
  getTokenHash,
  storeTokenToRouter,
} from "./deploy-warp-modules";
import { hexToBase64 } from "./warp-utils";
import { TxData } from "../../utils/interfaces";

// Upgrades a synthetic route between EVM and KDA, where EVM router is a collateral token
// and KDA router is a synthetic. This script upgrades both sides, EVM and KDA.

export const upgradeSyntheticWarpRoute = async (
  phase: string,
  hre: HardhatRuntimeEnvironment,
  mailboxAddress: `0x${string}`,
  proxyAdminAddress: `0x${string}`,
  hypERC20CollateralAddress: `0x${string}`,
  domainEVM: number,
  domainKDA: number,
) => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);
  const clientDatas = getClientDatas(phase);

  const hypERC20Collateral = await hre.viem.getContractAt(
    "HypERC20Collateral",
    hypERC20CollateralAddress,
  );
  const tokenAddressEVM = await hypERC20Collateral.read.wrappedToken();

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
  const hypERC20CollateralProxy = await hre.viem.getContractAt(
    "TransparentUpgradeableProxy",
    hypERC20CollateralAddress,
  );
  const proxyAdmin = await hre.viem.getContractAt(
    "ProxyAdmin",
    proxyAdminAddress,
  );
  await proxyAdmin.write.upgrade([
    hypERC20CollateralProxy.address,
    hypERC20CollateralImpl.address,
  ]);

  let promises: Promise<void>[] = new Array<Promise<void>>(clientDatas.length);
  for (let i: number = 0; i < clientDatas.length; i++) {
    promises[i] = upgradeHypERC20Synth(
      clientDatas[i],
      ba_account,
      ua_account,
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
};
