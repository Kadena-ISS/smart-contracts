import { IClient, IKeypair } from "@kadena/client";
import * as fs from "fs";
import { submitDeployContract, submitSignedTx } from "./execute";
import path from "path";

export const defineKeyset = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const command = `(namespace "free")
  (define-keyset "free.bridge-admin" (read-keyset '${keysetName}))`;

  const result = await submitSignedTx(client, keys, keysetName, command);
  console.log(result);
};

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

export const deployInterfaces = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const folderName = "../pact/interfaces/";
  const folder = await fs.promises.opendir(folderName);
  for await (const dirent of folder) {
    const fileName = path.join(folderName, dirent.name);
    const file = (await fs.promises.readFile(fileName)).toString();
    const result = await submitSignedTx(client, keys, keysetName, file);
    console.log(result);
  }
};
