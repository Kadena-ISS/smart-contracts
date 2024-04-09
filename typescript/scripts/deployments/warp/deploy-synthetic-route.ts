import { walletActions, toHex, parseEther } from "viem";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { b_account, f_user, getClientWithData } from "../../utils/constants";
import {
  deployHypERC20Synth,
  getRouterHash,
  storeRouterToMailbox,
  enrollRemoteRouter,
  fundAccountERC20,
} from "./deploy-warp-modules";
import { TokenType, TxData } from "../../utils/interfaces";

// Deploys a synthetic route between ETH and KDA, where ETH router is a collateral token
// and KDA router is a synthetic. This scripts deploys both sides, ETH and KDA.

export const deploySyntheticWarpRoute = async (
  hre: HardhatRuntimeEnvironment,
  mailboxAddress: `0x${string}`,
  ethDomain: number,
  kdaDomain: number,
  tokenNameETH: string,
  tokenNameKDA: string
) => {
  const [deployer] = await hre.viem.getWalletClients();
  const walletClient = deployer.extend(walletActions);

  const clientData = getClientWithData(0);
  const clientData_1 = getClientWithData(1);

  console.log("Deploying ETH Collateral");

  const collateralToken = await hre.viem.deployContract(
    "TestERC20Collateral",
    [],
    {
      walletClient,
    }
  );

  await collateralToken.write.initialize([
    parseEther("500"),
    tokenNameETH,
    tokenNameETH,
  ]);

  const erc20ETH = await hre.viem.deployContract(
    "HypERC20Collateral",
    [collateralToken.address, mailboxAddress],
    { walletClient }
  );

  //todo: deploy to all chains
  await Promise.all([
    deployHypERC20Synth(clientData, b_account, tokenNameKDA),
    deployHypERC20Synth(clientData_1, b_account, tokenNameKDA),
  ]);

  const kadena_router = (
    (await getRouterHash(clientData, tokenNameKDA)) as TxData
  ).data;
  const erc20_address = erc20ETH.address;
  console.log(erc20_address);

  const eth_router = "0x000000000000000000000000" + erc20_address.slice(2);
  console.log(eth_router);

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
    fundAccountERC20(clientData_1, f_user, tokenNameKDA),
  ]);

  return {
    [ethDomain]: {
      address: erc20_address,
      symbol: tokenNameETH,
      type: TokenType.Collateral,
    },
    [kdaDomain]: {
      address: `free.${tokenNameKDA}`,
      symbol: tokenNameKDA,
      type: TokenType.Synthetic,
    },
  };
};
