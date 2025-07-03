import path from "path";
import {
  IClientWithData,
  IAccountWithKeys,
  ICapability,
  TxData,
  IDomains,
} from "../../utils/interfaces";
import {
  submitSignedTxWithCap,
  submitReadTx,
  submitSignedTx,
  deployModuleDirectly,
  deployModule,
} from "../../utils/submit-tx";
import {
  createTokenFile,
  getCollateralFile,
  getSyntheticFile,
} from "../../generator/generate-modules";
import { PactNumber } from "@kadena/pactjs";
import { NAMESPACES } from "../../utils/constants";

const folderPrefix = "../../../../pact/";

export const deployHypERC20Synth = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  name: string,
  precision: number,
) => {
  const file = await getSyntheticFile();
  const resultSyn = await createTokenFile(file, name, precision.toString());

  const result = await deployModuleDirectly(client, sender, account, resultSyn);
  console.log(`\nDeploying ${name}`);
  console.log(result);
};

export const deployHypERC20Coll = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  name: string,
  collateral: string,
  precision: number,
) => {
  const file = await getCollateralFile();
  const resultCol = await createTokenFile(file, name, precision.toString());

  const result = await deployModuleDirectly(client, sender, account, resultCol);
  console.log(`\nDeploying ${name}`);
  console.log(result);

  const initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
    (${name}.initialize ${collateral})`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.${name}.ONLY_ADMIN`,
    },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log(`Initializing ${name}`);
  console.log(initResult);
};

export const deployFungible = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  name: string,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + `mainnet-tokens/${name}.pact`,
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log(`\nDeploying ${name}`);
  console.log(result);
};

export const enrollRemoteRouter = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  token: string,
  remoteRouterDomain: number,
  remoteRouterAddress: string,
) => {
  const enrollCommand = `
    (namespace "${NAMESPACES[client.phase as keyof IDomains]}")
    (router.enroll-remote-router ${remoteRouterDomain} ${token} "${remoteRouterAddress}")`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.router.ONLY_ADMIN`,
    },
  ];
  const enrollResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    enrollCommand,
    capabilities,
  );
  console.log("Enrolling router");
  console.log(enrollResult);
};

export const getTokenHash = async (
  client: IClientWithData,
  moduleName: string,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
    (base64-decode (router.get-token-hash ${moduleName}))`;
  const result = await submitReadTx(client, command);
  return result;
};

export const storeTokenToRouter = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  routerName: string,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
    (router.store-token-hash ${routerName})`;
  const result = await submitSignedTx(client, sender, account, command);
  console.log(`\nStoring router to Router`);
  console.log(result);
};

export const fundCollateralAccount = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  token: string,
  amount: number,
) => {
  const readCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}") (${token}.get-collateral-account)`;
  const tx = (await submitReadTx(client, readCommand)) as unknown as TxData;
  const collateralAccount = tx.data;

  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}") (coin.transfer "${sender.name}" "${collateralAccount}" ${amount}.0)`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: [
        `${sender.name}`,
        collateralAccount,
        new PactNumber(amount).toPactDecimal(),
      ],
    },
  ];
  const result = await submitSignedTxWithCap(
    client,
    sender,
    sender,
    command,
    capabilities,
  );
  console.log(`\nFunding ${token}`);
  console.log(result);
};

export const getBalanceERC20 = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  token: string,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
    (${token}.get-balance "${account.name}")`;
  const result = await submitSignedTx(client, sender, account, command);
  console.log(`\nGetting balance ${token}`);
  console.log(result);
};
