import { task } from "hardhat/config";
import { readFile } from "fs/promises";

import { KADENA_DOMAIN } from "../../../utils/constants";
import { configureCollateralWarpRoute } from "../cfg-col-route";
import { configureSyntheticWarpRoute } from "../cfg-synthetic-route";
import { writeFileSync } from "fs";
import { configureETH, mergeRoutesAndWrite } from "../utils";

task("warpt", "Deploys Warp Route To Testnet")
  .addPositionalParam("inputFile")
  .addPositionalParam("outputFile")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying Warp Route");
    const [deployer] = await hre.viem.getWalletClients();

    //TODO: CHANGE FILE TO BE FILLED IN WITH VALUES FOR CORESPONDING CHAIN
    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString());

    console.log("Configuring ETH");
    const oracleAddress: `0x${string}` = parsedJSON.storageGasOracle;
    const igpAddress: `0x${string}` = parsedJSON.interchainGasPaymaster;
    const mailboxAddress: `0x${string}` = parsedJSON.mailbox;
    await configureETH(hre, oracleAddress, igpAddress, mailboxAddress);

    const wethRouteResult = await configureSyntheticWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "WETH",
      "kb-WETH"
    );

    console.log(wethRouteResult);

    const usdcRouteResult = await configureSyntheticWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "USDC",
      "kb-USDC"
    );

    const wbtcRouteResult = await configureSyntheticWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "WBTC",
      "kb-WBTC"
    );

    const collateralRouteResult = await configureCollateralWarpRoute(
      hre,
      mailboxAddress,
      31337,
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
