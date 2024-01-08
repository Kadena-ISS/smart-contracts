import { IClient } from "@kadena/client";
import * as fs from "fs";
import { IAccountWithKeys, ICapability } from "./interfaces";
import {
  submitDeployContract,
  submitReadTx,
  submitSignedTx,
  submitSignedTxWithCap,
} from "./submit-tx";

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
        "domain": "31337",
        "token-exchange-rate": 1.0,
        "gas-price": 0.001
    }
    ])`;

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
      (igp.set-remote-gas-amount {"domain": "31337", "gas-amount": 1000.0})`;

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

export const deployHypERC20 = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying HypERC20");
  const fileName = "../../pact/hyp-erc20/hyp-erc20.pact";
  const result = await deployModule(client, account, fileName);
  console.log(result);

  console.log("Initializing HypERC20");
  const initCommand = `(namespace "free")
  (hyp-erc20.initialize mailbox igp)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "hyp-erc20.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);

  console.log("Enrolling router");
  const enrollCommand = `
  (namespace "free")
  (hyp-erc20.enroll-remote-router "31337" "0x4BD34992E0994E9d3c53c1CCfe5C2e38d907338e")`;

  const enrollResult = await submitSignedTxWithCap(
    client,
    account,
    enrollCommand,
    capabilities
  );
  console.log(enrollResult);
};

export const addDataToMailbox = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  const command = `(namespace "free")
  (mailbox.store-recipient "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" hyp-erc20)`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const getSomeData = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  const readCommand = `(namespace "free")
  (hyp-erc20.has-remote-router "31337")`;
  const readResult = await submitReadTx(client, readCommand);
  console.log(readResult);

  const command = `(namespace "free")
  (hyp-erc20.quote-gas-payment "31337")`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const deployVerifySPVTest = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying VerifySPV");

  const fileName = "../../pact/verify-spv-test.pact";
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

export const verifySPVProcess = async (client: IClient) => {
  const metadata =
    "0x0000000000000000000000002e234dae75c793f67a35089c9d99245e1c58470b7ca57d36281685aab33bce3c94766d3c206629baa030c43d29d3ae2ce4c0ef5a00000000dfdb2cb5fc128e08e27574e135a252b75519d47a9d71cff7655a6ebfd8477cca023fdb5a8a80fd447ce63ce280c86d704af94a2cc30b6429f89d1ee6e74a4cdb1b";
  const message =
    "0x03000000000000000b0000000000000000000000007fa9385be102ac3eac297483dd6233d62b3e1496000002720000000000000000000000006c414e7a15088023e28af44ad0e1d593671e4b1500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000008ac7230489e8000000000000000000000000000000000000000000000000000000000000000000426b3a33656263303863323265633538636237316430356235636331656366613164353462636530336465656437353632643766336136663966653839306132623232000000000000000000000000000000000000000000000000000000000000";
  const validators = ["0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6"];
  const threshold = 1;

  const command = `(namespace "free")
  (verify-spv-mock.process "${metadata}" "${message}" ["${validators}"] ${threshold})`;
  console.log(command)

  const result = await submitReadTx(client, command);
  console.log(result);
};

export const deployModule = async (
  client: IClient,
  account: IAccountWithKeys,
  fileName: string
) => {
  const file = (await fs.promises.readFile(fileName)).toString();
  return await submitDeployContract(client, account, file);
};
