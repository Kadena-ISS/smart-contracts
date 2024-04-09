import { task } from "hardhat/config";
import { readFile } from "fs/promises";

import { KADENA_DOMAIN } from "../../../utils/constants";
import { configureCollateralWarpRoute } from "../cfg-col-route";
import { configureSyntheticWarpRoute } from "../cfg-synthetic-route";
import { configureETH, mergeRoutesAndWrite } from "../utils";

task("warpt", "Deploys Warp Route To Testnet")
  .addPositionalParam("inputFile")
  .addPositionalParam("outputFile")
  .setAction(async (taskArgs, hre) => {
    const networkName = "anvil";
    // const networkName = hre.network.name;

    console.log(`Deploying Warp Route to ${networkName}`);

    const chainId = hre.network.config.chainId!;

    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString());
    const currentChain = parsedJSON[networkName];

    console.log("Configuring EVM");
    const oracleAddress: `0x${string}` = currentChain.storageGasOracle;
    const igpAddress: `0x${string}` = currentChain.interchainGasPaymaster;
    const mailboxAddress: `0x${string}` = currentChain.mailbox;

    await configureETH(hre, oracleAddress, igpAddress, mailboxAddress);

    const wethRouteResult = await configureSyntheticWarpRoute(
      hre,
      mailboxAddress,
      chainId,
      KADENA_DOMAIN,
      "WETH",
      "kb-WETH"
    );

    console.log(wethRouteResult);

    const usdcRouteResult = await configureSyntheticWarpRoute(
      hre,
      mailboxAddress,
      chainId,
      KADENA_DOMAIN,
      "USDC",
      "kb-USDC"
    );

    const wbtcRouteResult = await configureSyntheticWarpRoute(
      hre,
      mailboxAddress,
      chainId,
      KADENA_DOMAIN,
      "WBTC",
      "kb-WBTC"
    );

    const collateralRouteResult = await configureCollateralWarpRoute(
      hre,
      mailboxAddress,
      chainId,
      KADENA_DOMAIN,
      "kb-KDA",
      "KDA"
    );

    const resultArr = [
      wethRouteResult,
      usdcRouteResult,
      wbtcRouteResult,
      collateralRouteResult,
    ];
    await mergeRoutesAndWrite(taskArgs.outputFile, resultArr);
  });
