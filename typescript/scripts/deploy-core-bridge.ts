import {
  deployGasOracle,
  deployIGP,
  deployISM,
  deployMailbox,
  deployValidatorAnnounce,
} from "./deploy-modules";
import { deployStructs, deployInterfaces } from "./deploy-utils";
import { defineKeyset } from "./utils/kadena-utils";
import {
  b_account,
  clientData,
  clientData_1,
  s_account,
} from "./utils/constants";
import { deployAccounts } from "./deploy-accounts";

async function main() {
  // Deploy to chain 0
  await defineKeyset(clientData, s_account);

  Promise.all([deployAccounts(clientData), deployAccounts(clientData_1)]);

  await deployStructs(clientData, s_account);
  await deployInterfaces(clientData, s_account);

  Promise.all([
    deployGasOracle(clientData, b_account),
    deployValidatorAnnounce(clientData, b_account),
  ]);

  const validators = ["0x71239e00AE942B394B3a91ab229E5264aD836f6f"];
  const threshold = 1;
  Promise.all([
    deployISM(clientData, b_account, validators, threshold),
    deployIGP(clientData, b_account),
  ]);
  await deployMailbox(clientData, b_account);

  // Deploy to chain 1
  await deployStructs(clientData_1, s_account);
  await deployInterfaces(clientData_1, s_account);
  await deployGasOracle(clientData_1, b_account);
  await deployIGP(clientData_1, b_account);
}

main();
