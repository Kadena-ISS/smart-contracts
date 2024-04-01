import { walletActions, parseEther, toHex } from "viem";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  clientData,
  b_account,
  clientData_1,
  f_user,
  s_account,
} from "../utils/constants";
import {
  getRouterHash,
  storeRouterToMailbox,
  enrollRemoteRouter,
  fundAccountERC20,
  deployHypERC20Coll,
} from "./deploy-warp-modules";
import { fundCollateralModule } from "../utils/kadena-utils";
import { TxData } from "../utils/interfaces";

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
    collateralNameKda
  );
  await deployHypERC20Coll(
    clientData_1,
    b_account,
    tokenNameKDA,
    collateralNameKda
  );

  const tx = (await getRouterHash(
    clientData,
    tokenNameKDA
  )) as unknown as TxData;

  const kadena_router = tx.data; 
  
  const erc20_address = erc20ETH.address;

  const eth_router = "0x000000000000000000000000" + erc20_address.slice(2);

  await Promise.all([
    erc20ETH.write.enrollRemoteRouter([kdaDomain, toHex(kadena_router)]),
    storeRouterToMailbox(clientData, b_account, tokenNameKDA),
    enrollRemoteRouter(
      clientData,
      b_account,
      tokenNameKDA,
      ethDomain,
      eth_router
    ),
    fundAccountERC20(clientData, f_user, tokenNameKDA),
    fundCollateralModule(clientData, s_account, tokenNameKDA, 1000),
  ]);

  return {
    [ethDomain]: { address: erc20_address, symbol: tokenNameETH },
    [kdaDomain]: { address: `free.${tokenNameKDA}`, symbol: tokenNameKDA },
  };
};
