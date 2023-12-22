import { IClient, IKeypair } from "@kadena/client";
import * as fs from "fs";
import { submitSignedTx } from "./execute";
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

export const deployStructs = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const folderName = "../pact/structs/";
  const folder = await fs.promises.opendir(folderName);
  for await (const dirent of folder) {
    const fileName = path.join(folderName, dirent.name);
    console.log(fileName)
    const file = (await fs.promises.readFile(fileName)).toString();
    const result = await submitSignedTx(client, keys, keysetName, file);
    console.log(result);
  }
};

export const deployCoin = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {

  const fungibleV2Iface = (await fs.promises.readFile("../pact/interfaces/fungible-v2.pact")).toString();
  const fungibleV2Result = await submitSignedTx(client, keys, keysetName, fungibleV2Iface);
  console.log(fungibleV2Result);

  const fungibleXchainIface = (await fs.promises.readFile("../pact/coin/fungible-xchain-v1.pact")).toString();
  const fungibleXchainResult = await submitSignedTx(client, keys, keysetName, fungibleXchainIface);
  console.log(fungibleXchainResult);

  const coin = (await fs.promises.readFile("../pact/coin/coin-v5.pact")).toString();
  const coinResult = await submitSignedTx(client, keys, keysetName, coin);
  console.log(coinResult);
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
