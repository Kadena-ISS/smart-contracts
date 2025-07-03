import * as fs from "fs";
import path from "path";
import { IClientWithData, IAccountWithKeys } from "../../utils/interfaces";
import { submitSignedTx } from "../../utils/submit-tx";
import { createNamespaceFile } from "../../generator/generate-modules";

export const deployStructs = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  console.log("\nDeploying structs");

  const folderName = "../../../../pact/structs/";
  const fileNames = ["token-message.pact", "hyperlane-message.pact"];

  await loadFolderInOrder(client, sender, account, folderName, fileNames);
};

export const deployInterfaces = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  console.log("\nDeploying interfaces");
  const folderName = "../../../../pact/interfaces/";
  const fileNames = ["i-ism.pact", "i-token.pact", "i-mailbox.pact"];

  await loadFolderInOrder(client, sender, account, folderName, fileNames);
};

const loadFolderInOrder = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  folderName: string,
  fileNames: string[],
) => {
  const currentDir = path.join(__dirname, folderName);
  for (const fileName of fileNames) {
    const filePath = path.join(currentDir, fileName);
    const file = (await fs.promises.readFile(filePath)).toString();
    const resultFile = await createNamespaceFile(client, file);
    const result = await submitSignedTx(client, sender, account, resultFile);
    console.log("\n", filePath);
    console.log(result);
  }
};
