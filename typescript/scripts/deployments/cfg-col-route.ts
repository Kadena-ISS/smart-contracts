import { walletActions, parseEther } from "viem";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  clientData,
  b_account,
  clientData_1,
  f_user,
  t_account,
} from "../utils/constants";
import {
  getRouterHash,
  storeRouterToMailbox,
  enrollRemoteRouter,
  fundAccountERC20,
  deployHypERC20Coll,
} from "./deploy-warp-modules";

export const configureCollateralWarpRoute = async (
  hre: HardhatRuntimeEnvironment,
  mailboxAddress: `0x${string}`,
  ethDomain: number,
  kdaDomain: number,
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

  await deployHypERC20Coll(
    clientData,
    b_account,
    tokenNameKDA,
    collateralNameKda,
    t_account.name
  );
  await deployHypERC20Coll(
    clientData_1,
    b_account,
    tokenNameKDA,
    collateralNameKda,
    t_account.name
  );

  const kadena_router = (await getRouterHash(clientData, tokenNameKDA)).data;
  await storeRouterToMailbox(clientData, b_account, tokenNameKDA);

  const eth_router = erc20ETH.address;

  await Promise.all([
    enrollRemoteRouter(
      clientData,
      b_account,
      tokenNameKDA,
      ethDomain,
      eth_router
    ),
    fundAccountERC20(clientData, f_user, tokenNameKDA),
  ]);

  return {
    [ethDomain]: { address: eth_router, symbol: tokenNameETH },
    [kdaDomain]: { address: tokenNameKDA, symbol: tokenNameKDA },
  };
};
