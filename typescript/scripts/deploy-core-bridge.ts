import {
  deployGasOracle,
  deployIGP,
  deployISM,
  deployMailbox,
  deployValidatorAnnounce,
} from "./deploy-modules";
import { deployStructs, deployInterfaces } from "./deploy-utils";
import { defineKeyset, fundAccount } from "./utils/kadena-utils";
import {
  b_account,
  client,
  client_1,
  f_user,
  s_account,
  s_user,
  t_account,
  t_user,
} from "./utils/constants";
import { IClientWithData } from "./utils/interfaces";

async function main() {
  const clientWData: IClientWithData = { client, chainId: "0" };
  const clientWData1: IClientWithData = { client: client_1, chainId: "1" };

  await defineKeyset(clientWData, s_account);

  await fundAccount(clientWData, s_account, b_account, 100);
  await defineKeyset(clientWData, b_account);
  await fundAccount(clientWData, s_account, t_account, 100);
  await defineKeyset(clientWData, t_account);

  await fundAccount(clientWData, s_account, f_user, 100);
  await defineKeyset(clientWData, f_user);
  await fundAccount(clientWData, s_account, s_user, 100);
  await defineKeyset(clientWData, s_user);
  await fundAccount(clientWData, s_account, t_user, 100);
  await defineKeyset(clientWData, t_user);

  await fundAccount(clientWData1, s_account, f_user, 100);
  await defineKeyset(clientWData1, f_user);
  await fundAccount(clientWData1, s_account, s_user, 100);
  await defineKeyset(clientWData1, s_user);
  await fundAccount(clientWData1, s_account, t_user, 100);
  await defineKeyset(clientWData1, t_user);

  await deployStructs(clientWData, s_account);
  await deployInterfaces(clientWData, s_account);

  await deployGasOracle(clientWData, b_account);
  await deployValidatorAnnounce(clientWData, b_account);

  const validators = ["0x71239e00AE942B394B3a91ab229E5264aD836f6f"];
  const threshold = 1;
  await deployISM(clientWData, b_account, validators, threshold);

  await deployIGP(clientWData, b_account);
  await deployMailbox(clientWData, b_account);
}

main();
