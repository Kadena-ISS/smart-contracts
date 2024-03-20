import {
  IClientWithData,
  IAccountWithKeys,
  ICapability,
} from "../utils/interfaces";
import {
  deployModule,
  submitSignedTxWithCap,
  submitReadTx,
  submitSignedTx,
  deployModuleDirectly,
} from "../utils/submit-tx";
import {
  getTemplateFile,
  createSynthetic,
} from "../generator/generate-modules";

export const deployHypERC20Synth = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  name: string
) => {
  const file = await getTemplateFile();
  const resultSyn = await createSynthetic(file, name);

  const result = await deployModuleDirectly(client, account, resultSyn);
  console.log("\nDeploying HypERC20");
  console.log(result);

  const initCommand = `(namespace "free")
    (${name}.initialize)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "free.hyp-erc20.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log("Initializing HypERC20");
  console.log(initResult);
};

export const enrollRemoteRouter = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  remoteRouterDomain: string,
  remoteRouterAddress: string
) => {
  console.log("Enrolling router");
  const enrollCommand = `
    (namespace "free")
    (hyp-erc20.enroll-remote-router "${remoteRouterDomain}" "${remoteRouterAddress}")`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "free.hyp-erc20.ONLY_ADMIN" },
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
  token: string,
  receiver: IAccountWithKeys
) => {
  const command = `(namespace "free")
    (${token}.mint-to "${receiver.name}" 500.0)`;
  const result = await submitSignedTx(client, account, command);
  console.log(JSON.stringify(result));
};
