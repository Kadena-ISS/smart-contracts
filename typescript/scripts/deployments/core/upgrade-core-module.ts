import path from "path";
import { IClientWithData, IAccountWithKeys } from "../../utils/interfaces";
import { upgradeModule } from "../../utils/submit-tx";

const folderPrefix = "../../../../pact/";

export const upgradeGasOracle = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-oracle/gas-oracle.pact",
  );
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\Upgrading GasOracle");
  console.log(result);
};

export const upgradeValidatorAnnounce = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "validator-announce/validator-announce.pact",
  );
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\Upgrading ValidatorAnnounce");
  console.log(result);
};

export const upgradeISM = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "ism/merkle-tree-ism.pact",
  );
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\Upgrading ISM");
  console.log(result);
};

export const upgradeISMRouting = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "ism/domain-routing-ism.pact",
  );
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\nUpgrading ISM Routing");
  console.log(result);
};

export const upgradeIGP = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(__dirname, folderPrefix + "igp/igp.pact");
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\nUpgrading IGP");
  console.log(result);
};

export const upgradeMerkleTreeHook = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "merkle/merkle-tree-hook.pact",
  );
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\nUpgrading Merkle Tree Hook");
  console.log(result);
};

export const upgradeRouter = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(__dirname, folderPrefix + "router/router.pact");
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\nUpgrading Router");
  console.log(result);
};

export const upgradeMailbox = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(__dirname, folderPrefix + "mailbox/mailbox.pact");
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\nUpgrading Mailbox");
  console.log(result);
};

export const upgradeGasStation = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-station/kinesis-gas-station.pact",
  );
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\nUpgrading Gas Station");
  console.log(result);
};

export const upgradeFaucet = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(__dirname, folderPrefix + "faucet/faucet.pact");
  const result = await upgradeModule(client, sender, account, fileName);
  console.log("\nUpgrading Faucet");
  console.log(result);
};
