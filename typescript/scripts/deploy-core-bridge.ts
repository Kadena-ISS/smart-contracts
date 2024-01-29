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
  clientWData,
  clientWData1,
  s_account,
} from "./utils/constants";
import { deployAccounts } from "./deploy-accounts";

async function main() {
  await defineKeyset(clientWData, s_account);

  Promise.all([deployAccounts(clientWData), deployAccounts(clientWData1)]);

  await deployStructs(clientWData, s_account);
  await deployInterfaces(clientWData, s_account);

  Promise.all([
    deployGasOracle(clientWData, b_account),
    deployValidatorAnnounce(clientWData, b_account),
  ]);

  const validators = ["0x71239e00AE942B394B3a91ab229E5264aD836f6f"];
  const threshold = 1;
  Promise.all([
    deployISM(clientWData, b_account, validators, threshold),
    deployIGP(clientWData, b_account),
  ]);
  await deployMailbox(clientWData, b_account);
}

main();
