import { walletActions, toHex, parseEther } from "viem";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { b_account, getClientWithData } from "../../utils/constants";
import { getRouterHash, enrollRemoteRouter } from "./deploy-warp-modules";
import { TokenType, TxData } from "../../utils/interfaces";

// Configures a synthetic route between ETH and KDA, where ETH router is a collateral token
// and KDA router is a synthetic. This scripts deploys ETH side and configures KDA.

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

  const clientData = getClientWithData(0);

  console.log("Deploying ETH Router");

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

  const kadena_router = (
    (await getRouterHash(clientData, tokenNameKDA)) as TxData
  ).data;
  const erc20_address = erc20ETH.address;

  const eth_router = "0x000000000000000000000000" + erc20_address.slice(2);

  await Promise.all([
    erc20ETH.write.enrollRemoteRouter([kdaDomain, toHex(kadena_router)]),
    enrollRemoteRouter(
      clientData,
      b_account,
      tokenNameKDA,
      ethDomain,
      eth_router
    ),
  ]);

  return {
    [ethDomain]: {
      address: erc20_address,
      symbol: tokenNameETH,
      type: TokenType.Collateral,
    },
  };
};
