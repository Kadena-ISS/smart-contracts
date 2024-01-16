import {
  deployGasOracle,
  deployIGP,
  deployISM,
  deployMailbox,
  deployValidatorAnnounce,
  fundAccountERC20,
  registerAccountWithERC20,
  transferRemoteERC20,
} from "./deploy-modules";
import { deployStructs, deployInterfaces } from "./deploy-utils";
import { defineKeyset, fundAccount } from "./utils/kadena-utils";
import { b_account, client, s_account, u_account } from "./utils/constants";

async function main() {

  await defineKeyset(client, s_account);

  await fundAccount(client, s_account, b_account, 100);
  await defineKeyset(client, b_account);

  await fundAccount(client, s_account, u_account, 100);
  await defineKeyset(client, u_account);

  await deployStructs(client, s_account);
  await deployInterfaces(client, s_account);

  await deployGasOracle(client, b_account);
  await deployValidatorAnnounce(client, b_account);

  const validators = ["0x71239e00AE942B394B3a91ab229E5264aD836f6f"];
  const threshold = 1;
  await deployISM(client, b_account, validators, threshold);

  await deployIGP(client, b_account);
  await deployMailbox(client, b_account);
}

main();
