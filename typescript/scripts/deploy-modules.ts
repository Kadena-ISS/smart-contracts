import { IClient } from "@kadena/client";
import * as fs from "fs";
import path from "path";
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
  const fileName = path.join(
    __dirname,
    "../../pact/gas-oracle/gas-oracle.pact"
  );
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

  const fileName = path.join(
    __dirname,
    "../../pact/validator-announce/validator-announce.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log(result);

  const validator = "0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6";
  const storage_location = "storage-location";
  const sig = "";
  console.log("Initializing ValidatorAnnounce");
  const initCommand = `(namespace "free")
  (validator-announce.announce "${validator}" "${storage_location}" "${sig}")`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "validator-announce.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployISM = async (
  client: IClient,
  account: IAccountWithKeys,
  validators: string[],
  threshold: number
) => {
  console.log("\nDeploying ISM");

  const fileName = path.join(__dirname, "../../pact/ism/ism.pact");
  const result = await deployModule(client, account, fileName);
  console.log(result);

  console.log("Initializing ISM");
  let validatorsString = "";
  validators.forEach((validator) => {
    validatorsString += `"${validator}"`;
  });

  console.log(validatorsString);
  const initCommand = `(namespace "free")
    (ism.initialize [${validatorsString}] ${threshold})`;
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

  const fileName = path.join(__dirname, "../../pact/igp/igp.pact");
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

  const fileName = path.join(__dirname, "../../pact/mailbox/mailbox.pact");
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
  const fileName = path.join(__dirname, "../../pact/hyp-erc20/hyp-erc20.pact");
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
};

export const enrollRemoteRouter = async (
  client: IClient,
  account: IAccountWithKeys,
  remoteRouterDomain: string,
  remoteRouterAddress: string
) => {
  console.log("Enrolling Remote Router");
  const enrollCommand = `
  (namespace "free")
  (hyp-erc20.enroll-remote-router "${remoteRouterDomain}" "${remoteRouterAddress}")`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "hyp-erc20.ONLY_ADMIN" },
  ];

  const enrollResult = await submitSignedTxWithCap(
    client,
    account,
    enrollCommand,
    capabilities
  );
  console.log(enrollResult);
};

export const storeRouterToMailbox = async (
  client: IClient,
  account: IAccountWithKeys,
  recipient: string
) => {
  console.log("Storing Router to Mailbox")
  const command = `(namespace "free")
  (mailbox.store-recipient "${recipient}" hyp-erc20)`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const processMailbox = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  const metadata =
    "0x0000000000000000000000002e234dae75c793f67a35089c9d99245e1c58470bf7b18e31b3dca9568a2a8660b7bc71a563a527ecfe7bb075965bc9741460f58b000000006606030837e1208f45bf393d75a0a5ef91dabe302c17a0e96be7281b84a673631850bfc937c6c28360049a3f266bc99ca52c0c4ac1fc9bdfa56b3df86e5121bd1c";
  const message =
    "0x030000000000007a690000000000000000000000007fa9385be102ac3eac297483dd6233d62b3e1496000002720000000000000000000000006c414e7a15088023e28af44ad0e1d593671e4b1500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000000000000000005616c696365000000000000000000000000000000000000000000000000000000";

  const command = `(namespace "free")
  (mailbox.process "${metadata}" "${message}")`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const dispatchMailbox = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  const command = `(namespace "free")
  (hyp-erc20.transfer-remote "31337" "${account.name}" "0x6c414e7a15088023e28af44ad0e1d593671e4b15" 50.0)`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const fundAccountERC20 = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  const command = `(namespace "free")
  (hyp-erc20.mint-to "${account.name}" 500.0)`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const transferRemoteERC20 = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  const command = `(namespace "free")
  (hyp-erc20.transfer-remote "31337" "${account.name}" "0x6c414e7a15088023e28af44ad0e1d593671e4b15" 50.0)`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const transferFromUser = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  const command = `(namespace "free")
  (hyp-erc20.transfer-remote 50.0)`;
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

  const fileName = path.join(__dirname, "../../pact/verify-spv-test.pact");
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

interface ProcessData {
  status: string;
  data: any[];
}

export const verifySPVProcess = async (client: IClient) => {
  const metadata =
    "0x0000000000000000000000002e234dae75c793f67a35089c9d99245e1c58470bf7b18e31b3dca9568a2a8660b7bc71a563a527ecfe7bb075965bc9741460f58b000000006606030837e1208f45bf393d75a0a5ef91dabe302c17a0e96be7281b84a673631850bfc937c6c28360049a3f266bc99ca52c0c4ac1fc9bdfa56b3df86e5121bd1c";
  const message =
    "0x030000000000007a690000000000000000000000007fa9385be102ac3eac297483dd6233d62b3e1496000002720000000000000000000000006c414e7a15088023e28af44ad0e1d593671e4b1500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000000000000000005616c696365000000000000000000000000000000000000000000000000000000";
  const validators = ["0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6"];
  const threshold = 1;

  const command = `(namespace "free")
  (verify-spv-mock.process "${metadata}" "${message}" ["${validators}"] ${threshold})`;
  console.log(command);

  const result = await submitReadTx(client, command);
  const parsedResult = result as unknown as ProcessData;
  console.log(parsedResult.data[1]);
};

export const registerAccountWithERC20 = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  const command = `(namespace "free")
  (hyp-erc20.create-account "${account.name}" (describe-keyset "free.${account.keysetName}"))
  (hyp-erc20.mint-to "${account.name}" 500.0)`;
  const result = await submitSignedTx(client, account, command);
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
