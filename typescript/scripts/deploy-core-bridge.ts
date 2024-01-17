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
import { b_account, client, f_user, s_account, s_user, t_user } from "./utils/constants";

async function main() {

  await defineKeyset(client, s_account);

  await fundAccount(client, s_account, b_account, 100);
  await defineKeyset(client, b_account);

  await fundAccount(client, s_account, f_user, 100);
  await defineKeyset(client, f_user);
  await fundAccount(client, s_account, s_user, 100);
  await defineKeyset(client, s_user);
  await fundAccount(client, s_account, t_user, 100);
  await defineKeyset(client, t_user);

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
