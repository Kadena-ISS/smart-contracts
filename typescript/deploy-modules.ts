import { IClient, IKeypair } from "@kadena/client";
import * as fs from "fs";
import {
  ICapability,
  submitDeployContract,
  submitSignedTxWithCap,
} from "./kadena-utils";

export const deployGasOracle = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const file = (
    await fs.promises.readFile("../pact/gas-oracle/gas-oracle.pact")
  ).toString();

  const result = await submitDeployContract(client, keys, keysetName, file);
  console.log(result);
};

export const deployValidatorAnnounce = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const file = (
    await fs.promises.readFile(
      "../pact/validator-announce/validator-announce.pact"
    )
  ).toString();

  const result = await submitDeployContract(client, keys, keysetName, file);
  console.log(result);
};

export const deployISM = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string,
  threshold: number
) => {
  const file = (await fs.promises.readFile("../pact/ism/ism.pact")).toString();

  const deployResult = await submitDeployContract(
    client,
    keys,
    keysetName,
    file
  );
  console.log("Deploy", deployResult);

  const commandResult = `(namespace "free")
    (ism.initialize validator-announce ${threshold})`;
  const capabilities: ICapability[] = [{ name: "ism.ONLY_ADMIN" }];

  const initResult = await submitSignedTxWithCap(
    client,
    keys,
    keysetName,
    capabilities,
    commandResult
  );
  console.log("Init", initResult);
};

export const deployIGP = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const file = (await fs.promises.readFile("../pact/igp/igp.pact")).toString();

  const deployResult = await submitDeployContract(
    client,
    keys,
    keysetName,
    file
  );
  console.log(deployResult);

  const commandResult = `(namespace "free")
      (igp.initialize gas-oracle coin "treasury")`;

  const capabilities: ICapability[] = [{ name: "igp.ONLY_ADMIN" }];
  const initResult = await submitSignedTxWithCap(
    client,
    keys,
    keysetName,
    capabilities,
    commandResult
  );
  console.log(initResult);
};

export const deployMailbox = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const file = (
    await fs.promises.readFile("../pact/mailbox/mailbox.pact")
  ).toString();

  const deployResult = await submitDeployContract(
    client,
    keys,
    keysetName,
    file
  );
  console.log(deployResult);

  const commandResult = `(namespace "free")
      (mailbox.initialize ism igp)`;

  const capabilities: ICapability[] = [{ name: "mailbox.ONLY_ADMIN" }];
  const initResult = await submitSignedTxWithCap(
    client,
    keys,
    keysetName,
    capabilities,
    commandResult
  );
  console.log(initResult);
};