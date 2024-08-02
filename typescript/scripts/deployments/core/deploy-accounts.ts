import {
  s_account,
  b_account,
  bg_account,
  f_user,
  u_account,
} from "../../utils/constants";
import { IClientWithData } from "../../utils/interfaces";
import { fundAccount, defineKeyset } from "../../utils/kadena-utils";

export const deployAccounts = async (client: IClientWithData) => {
  // Deploy bridge-admin
  await fundAccount(client, s_account, b_account, 10000);
  await defineKeyset(client, b_account);

  // Deploy gas-oracle-admin
  await fundAccount(client, s_account, bg_account, 10000);
  await defineKeyset(client, bg_account);

  // Deploy gas-oracle-admin
  await fundAccount(client, s_account, u_account, 10000);
  await defineKeyset(client, u_account);

  // Deploy user accounts
  await fundAccount(client, s_account, f_user, 10000);
  await defineKeyset(client, f_user);
};
