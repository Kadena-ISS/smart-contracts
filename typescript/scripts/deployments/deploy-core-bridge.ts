import {
  deployEmptyMailbox,
  deployFaucet,
  deployGasOracle,
  deployGasStation,
  deployGuards,
  deployGuards1,
  deployIGP,
  deployISM,
  deployMailbox,
  deployValidatorAnnounce,
} from "./deploy-core-modules";
import { deployStructs, deployInterfaces } from "./deploy-utils";
import { defineKeyset } from "../utils/kadena-utils";
import {
  b_account,
  clientData,
  clientData_1,
  s_account,
} from "../utils/constants";
import { deployAccounts } from "./deploy-accounts";
import {
  IMultisigISMCfg,
  IRemoteGasAmount,
  IRemoteGasData,
  IValidatorAnnounceCfg,
} from "../utils/interfaces";

async function main() {
  // Deploy to chain 0
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

  const validatorCfg: IValidatorAnnounceCfg = {
    validator: "0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6",
    storageLocation: "location",
    signature: "sig",
  };

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
  await deployMailbox(clientData, b_account);
  await deployEmptyMailbox(clientData_1, b_account);

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
