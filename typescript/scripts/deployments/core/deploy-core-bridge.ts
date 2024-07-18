import { s_account, b_account, getClientWithData } from "../../utils/constants";
import {
  IRemoteGasData,
  IValidatorAnnounceCfg,
  IMultisigISMCfg,
  IRemoteGasAmount,
} from "../../utils/interfaces";
import { defineKeyset } from "../../utils/kadena-utils";
import { deployAccounts } from "./deploy-accounts";
import {
  deployGasOracle,
  deployISM,
  deployIGP,
  deployMailbox,
  deployEmptyMailbox,
  deployGuards,
  deployGuards1,
  deployGasStation,
  deployFaucet,
  deployMerkleTreeHook,
  initMerkleTreeHook,
} from "./deploy-core-modules";
import { deployStructs, deployInterfaces } from "./deploy-utils";

async function main() {
  // Deploy to chain 0
  const clientData = getClientWithData(0);
  const clientData_1 = getClientWithData(1);

  await defineKeyset(clientData, s_account);

  await Promise.all([
    deployAccounts(clientData),
    deployAccounts(clientData_1),
    deployStructs(clientData, s_account),
    deployStructs(clientData_1, s_account),
    deployInterfaces(clientData, s_account),
    deployInterfaces(clientData_1, s_account),
  ]);

  const remoteGasData: IRemoteGasData = {
    domain: "31337",
    tokenExchangeRate: "1.0",
    gasPrice: "0.001",
  };

  // const validatorCfg: IValidatorAnnounceCfg = {
  //   validator: "0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6",
  //   storageLocation: "location",
  //   signature: "sig",
  // };

  await Promise.all([
    deployGasOracle(clientData, b_account, remoteGasData),
    // deployValidatorAnnounce(clientData, b_account, validatorCfg),
    deployGasOracle(clientData_1, b_account, remoteGasData),
    // deployValidatorAnnounce(clientData_1, b_account, validatorCfg),
  ]);

  const multisigISMCfg: IMultisigISMCfg = {
    validators: ["0x71239e00ae942b394b3a91ab229e5264ad836f6f"],
    threshold: 1,
  };

  const remoteGasAmount: IRemoteGasAmount = {
    domain: "31337",
    gasAmount: "1000.0",
  };

  await Promise.all([
    deployISM(clientData, b_account, multisigISMCfg),
    deployIGP(clientData, b_account, remoteGasAmount),
    deployISM(clientData_1, b_account, multisigISMCfg),
    deployIGP(clientData_1, b_account, remoteGasAmount),
  ]);

  await deployMerkleTreeHook(clientData, b_account);
  await deployMailbox(clientData, b_account);
  await deployEmptyMailbox(clientData_1, b_account);
  await initMerkleTreeHook(clientData, b_account);

  await Promise.all([
    deployGuards(clientData, s_account),
    deployGuards1(clientData, s_account),
    deployGuards(clientData_1, s_account),
    deployGuards1(clientData_1, s_account),
  ]);

  await Promise.all([
    deployGasStation(clientData, s_account),
    deployGasStation(clientData_1, s_account),
    deployFaucet(clientData, b_account, s_account),
    deployFaucet(clientData_1, b_account, s_account),
  ]);
}

main();
