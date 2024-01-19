import { IClient } from "@kadena/client";
import * as fs from "fs";
import path from "path";
import { submitSignedTx } from "./utils/submit-tx";
import { IAccountWithKeys } from "./utils/interfaces";

export const deployStructs = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying structs");

  const folderName = "../../pact/structs/";
  const fileNames = ["token-message.pact", "hyperlane-message.pact"];

  await loadFolderInOrder(client, account, folderName, fileNames);
};

export const deployInterfaces = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying interfaces");
  const folderName = "../../pact/interfaces/";
  const fileNames = [
    "i-validator.pact",
    "i-gas-oracle.pact",
    "i-ism.pact",
    // "poly-fungible-v1.pact",
    "i-igp.pact",
    "i-router.pact",
    "i-mailbox.pact",
  ];

  await loadFolderInOrder(client, account, folderName, fileNames);
};

const loadFolderInOrder = async (
  client: IClient,
  account: IAccountWithKeys,
  folderName: string,
  fileNames: string[]
) => {
  const currentDir = path.join(__dirname, folderName);
  for (const fileName of fileNames) {
    const filePath = path.join(currentDir, fileName);
    console.log("\n", filePath);
    const file = (await fs.promises.readFile(filePath)).toString();
    const result = await submitSignedTx(client, account, file);
    console.log(result);
  }
};
