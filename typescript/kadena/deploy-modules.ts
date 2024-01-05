import { IClient, IKeypair } from "@kadena/client";
import * as fs from "fs";
import { IAccountWithKeys, ICapability } from "./interfaces";
import { submitDeployContract, submitSignedTxWithCap } from "./submit-tx";

export const deployGasOracle = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying GasOracle");
  const fileName = "../../pact/gas-oracle/gas-oracle.pact";
  const result = await deployModule(client, account, fileName);
  console.log(result);

  const initCommand = `(namespace "free")
  (gas-oracle.set-remote-gas-data-configs [
    {
        "domain": "1",
        "token-exchange-rate": 1.0,
        "gas-price": 0.001
    }
    ])`; //todo: dynamically change data

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "gas-oracle.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployValidatorAnnounce = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying ValidatorAnnounce");

  const fileName = "../../pact/validator-announce/validator-announce.pact";
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

export const deployISM = async (
  client: IClient,
  account: IAccountWithKeys,
  threshold: number
) => {
  console.log("\nDeploying ISM");

  const fileName = "../../pact/ism/ism.pact";
  const result = await deployModule(client, account, fileName);
  console.log(result);

  console.log("Initializing ISM");

  const initCommand = `(namespace "free")
    (ism.initialize validator-announce ${threshold})`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "ism.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployIGP = async (client: IClient, account: IAccountWithKeys) => {
  console.log("\nDeploying IGP");

  const fileName = "../../pact/igp/igp.pact";
  const result = await deployModule(client, account, fileName);
  console.log(result);

  const initCommand = `(namespace "free")
      (igp.initialize gas-oracle coin "treasury")
      (igp.set-remote-gas-amount {"domain": "1", "gas-amount": 1000.0})`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "igp.ONLY_ADMIN" },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployMailbox = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying Mailbox");

  const fileName = "../../pact/mailbox/mailbox.pact";
  const result = await deployModule(client, account, fileName);
  console.log(result);

  const initCommand = `(namespace "free")
      (mailbox.initialize ism igp)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "mailbox.ONLY_ADMIN" },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployModule = async (
  client: IClient,
  account: IAccountWithKeys,
  fileName: string
) => {
  const file = (await fs.promises.readFile(fileName)).toString();
  return await submitDeployContract(client, account, file);
};
