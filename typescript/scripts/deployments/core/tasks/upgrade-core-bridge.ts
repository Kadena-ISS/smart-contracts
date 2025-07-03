import { task } from "hardhat/config";
import {
  ba_account,
  getClientDatas,
  ua_account,
} from "../../../utils/constants";
import {
  upgradeFaucet,
  upgradeGasOracle,
  upgradeGasStation,
  upgradeIGP,
  upgradeISM,
  upgradeISMRouting,
  upgradeMailbox,
  upgradeMerkleTreeHook,
  upgradeRouter,
  upgradeValidatorAnnounce,
} from "../upgrade-core-module";

task("upgrade-core", "Upgrade Core Bridge")
  .addPositionalParam("phase")
  .setAction(async (taskArgs) => {
    console.log("Upgrading Core Bridge");

    const clientDatas = getClientDatas(taskArgs.phase);

    let promises: Promise<void>[] = new Array<Promise<void>>(
      clientDatas.length,
    );

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeGasOracle(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeValidatorAnnounce(
        clientDatas[i],
        ba_account,
        ua_account,
      );
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeISM(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeISMRouting(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeIGP(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeMerkleTreeHook(
        clientDatas[i],
        ba_account,
        ua_account,
      );
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeRouter(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeMailbox(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = upgradeGasStation(clientDatas[i], ba_account, ua_account);
    }
    await Promise.all(promises);

    if (taskArgs.phase !== "mainnet") {
      for (let i: number = 0; i < clientDatas.length; i++) {
        promises[i] = upgradeFaucet(clientDatas[i], ba_account, ua_account);
      }
      await Promise.all(promises);
    }
  });
