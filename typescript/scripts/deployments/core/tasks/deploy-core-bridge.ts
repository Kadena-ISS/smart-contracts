import { task } from "hardhat/config";
import {
  ba_account,
  getClientDatas,
  goa_account,
} from "../../../utils/constants";
import { deployAccounts } from "../deploy-accounts";
import {
  deployGasOracle,
  deployISM,
  deployIGP,
  deployMailbox,
  deployGuards,
  deployGuards1,
  deployGasStation,
  deployFaucet,
  deployMerkleTreeHook,
  deployValidatorAnnounce,
  deployISMRouting,
  setMailbox,
  setupGasOracle,
  deployRouter,
} from "../deploy-core-modules";
import { deployStructs, deployInterfaces } from "../deploy-utils";

task("deploy-core", "Deploy Core Bridge")
  .addPositionalParam("phase")
  .setAction(async (taskArgs) => {
    console.log("Deploying Core Bridge");

    const clientDatas = getClientDatas(taskArgs.phase);

    let promises: Promise<void>[] = new Array<Promise<void>>(
      clientDatas.length,
    );

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployAccounts(clientDatas[i]);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployStructs(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployInterfaces(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployGasOracle(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = setupGasOracle(clientDatas[i], ba_account, goa_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployValidatorAnnounce(
        clientDatas[i],
        ba_account,
        ba_account,
      );
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployISM(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployISMRouting(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployIGP(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployMerkleTreeHook(
        clientDatas[i],
        ba_account,
        ba_account,
      );
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployRouter(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployMailbox(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = setMailbox(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployGuards(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployGuards1(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    for (let i: number = 0; i < clientDatas.length; i++) {
      promises[i] = deployGasStation(clientDatas[i], ba_account, ba_account);
    }
    await Promise.all(promises);

    if (taskArgs.phase !== "mainnet") {
      for (let i: number = 0; i < clientDatas.length; i++) {
        promises[i] = deployFaucet(clientDatas[i], ba_account, ba_account);
      }
      await Promise.all(promises);
    }
  });
