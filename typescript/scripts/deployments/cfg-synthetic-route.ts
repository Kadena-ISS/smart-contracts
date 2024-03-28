import { walletActions, toHex, parseEther } from "viem";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  clientData,
  b_account,
  clientData_1,
  f_user,
} from "../utils/constants";
import {
  deployHypERC20Synth,
  getRouterHash,
  storeRouterToMailbox,
  enrollRemoteRouter,
  fundAccountERC20,
} from "./deploy-warp-modules";

export const configureSyntheticWarpRoute = async (
  hre: HardhatRuntimeEnvironment,
  mailboxAddress: `0x${string}`,
  ethDomain: number,
  kdaDomain: number,
  tokenNameETH: string,
  tokenNameKDA: string
) => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);

  console.log("Deploying ETH Router");
  const erc20ETH = await hre.viem.deployContract(
    "TestERC20",
    [18, mailboxAddress],
    { walletClient }
  );

  await erc20ETH.write.initialize([
    parseEther("500"),
    tokenNameETH,
    tokenNameETH,
  ]);

  //todo: deploy to all chains
  await Promise.all([
    deployHypERC20Synth(clientData, b_account, tokenNameKDA),
    deployHypERC20Synth(clientData_1, b_account, tokenNameKDA),
  ]);

  const kadena_router = (await getRouterHash(clientData, tokenNameKDA)).data;
  console.log(await getRouterHash(clientData, tokenNameKDA))
  console.log(kadena_router)
  const eth_router = erc20ETH.address;

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
  ]);

  return {
    [ethDomain]: { address: eth_router, symbol: tokenNameETH },
    [kdaDomain]: { address: `free.${tokenNameKDA}`, symbol: tokenNameKDA },
  };
};
