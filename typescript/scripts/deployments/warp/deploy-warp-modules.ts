import {
  IClientWithData,
  IAccountWithKeys,
  ICapability,
} from "../../utils/interfaces";
import {
  submitSignedTxWithCap,
  submitReadTx,
  submitSignedTx,
  deployModuleDirectly,
} from "../../utils/submit-tx";
import {
  createNamedFile,
  getCollateralFile,
  getSyntheticFile,
} from "../../generator/generate-modules";

export const deployHypERC20Synth = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  name: string
) => {
  const file = await getSyntheticFile();
  const resultSyn = await createNamedFile(file, name);

  const result = await deployModuleDirectly(client, account, resultSyn);
  console.log(`\nDeploying ${name}`);
  console.log(result);

  const initCommand = `(namespace "free")
    (${name}.initialize)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: `free.${name}.ONLY_ADMIN` },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(`Initializing ${name}`);
  console.log(initResult);
};

export const deployHypERC20Coll = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  name: string,
  collateral: string
) => {
  const file = await getCollateralFile();
  const resultCol = await createNamedFile(file, name);

  const result = await deployModuleDirectly(client, account, resultCol);
  console.log(`\nDeploying ${name}`);
  console.log(result);

  const initCommand = `(namespace "free")
    (${name}.initialize ${collateral})`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: `free.${name}.ONLY_ADMIN` },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(`Initializing ${name}`);
  console.log(initResult);
};

export const enrollRemoteRouter = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  token: string,
  remoteRouterDomain: number,
  remoteRouterAddress: string
) => {
  console.log("Enrolling router");
  const enrollCommand = `
    (namespace "free")
    (${token}.enroll-remote-router "${remoteRouterDomain}" "${remoteRouterAddress}")`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: `free.${token}.ONLY_ADMIN` },
  ];

  const enrollResult = await submitSignedTxWithCap(
    client,
    account,
    enrollCommand,
    capabilities
  );
  console.log(enrollResult);
};

export const getRouterHash = async (
  client: IClientWithData,
  moduleName: string
) => {
  const command = `(namespace "free")
    (mailbox.get-router-hash ${moduleName})`;
  const result = await submitReadTx(client, command);
  return result;
};

export const storeRouterToMailbox = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  routerName: string
) => {
  const command = `(namespace "free")
    (mailbox.store-router ${routerName})`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const fundAccountERC20 = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  token: string
) => {
  const command = `(namespace "free")
    (${token}.create-account "${account.name}" (describe-keyset "free.${account.keysetName}"))
    (${token}.mint-to "${account.name}" 500.0)`;
  const result = await submitSignedTx(client, account, command);
  console.log(JSON.stringify(result));
};

export const getBalanceERC20 = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  token: string
) => {
  const command = `(namespace "free")
    (${token}.get-balance "${account.name}")`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};
