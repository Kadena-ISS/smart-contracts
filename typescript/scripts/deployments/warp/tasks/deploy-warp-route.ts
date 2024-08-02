import { task } from "hardhat/config";
import { readFile } from "fs/promises";

import { KADENA_DOMAIN } from "../../../utils/constants";
import { writeFileSync } from "fs";
import { deploySyntheticWarpRoute } from "../deploy-synthetic-route";
import { deployCollateralWarpRoute } from "../deploy-col-route";
import { configureETH } from "../utils";

task("warp", "Deploys Warp Route")
  .addPositionalParam("inputFile")
  .addPositionalParam("outputFile")
  .setAction(async (taskArgs, hre) => {
    console.log("Deploying Warp Route");
    const file = await readFile(taskArgs.inputFile);
    const parsedJSON = JSON.parse(file.toString()).anvil;

    console.log("Configuring ETH");
    const oracleAddress: `0x${string}` = parsedJSON.storageGasOracle;
    const igpAddress: `0x${string}` = parsedJSON.interchainGasPaymaster;
    const mailboxAddress: `0x${string}` = parsedJSON.mailbox;
    await configureETH(hre, oracleAddress, igpAddress, mailboxAddress);

    const wethRouteResult = await deploySyntheticWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "WETH",
      "kb-WETH",
      '18'
    );

    const usdcRouteResult = await deploySyntheticWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "USDC",
      "kb-USDC",
      '18'
    );

    const wbtcRouteResult = await deploySyntheticWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "WBTC",
      "kb-WBTC",
      '18'
    );

    const collateralRouteResult = await deployCollateralWarpRoute(
      hre,
      mailboxAddress,
      31337,
      KADENA_DOMAIN,
      "kb-KDA",
      "KDA",
      "coin",
      '18'
    );

    const result = JSON.stringify({
      ETH: wethRouteResult,
      USDC: usdcRouteResult,
      WBTC: wbtcRouteResult,
      KDA: collateralRouteResult,
    });
    writeFileSync(taskArgs.outputFile, result, {
      flag: "w",
    });
  });
