import { s_account, b_account, t_account, f_user, s_user, t_user } from "./utils/constants";
import { IClientWithData } from "./utils/interfaces";
import { fundAccount, defineKeyset } from "./utils/kadena-utils";

export const deployAccounts = async (client: IClientWithData) => {
  // Deploy bridge-admin
  await fundAccount(client, s_account, b_account, 100);
  await defineKeyset(client, b_account);
  // Deploy treasury
  await fundAccount(client, s_account, t_account, 100);
  await defineKeyset(client, t_account);

  // Deploy user accounts
  await fundAccount(client, s_account, f_user, 100);
  await defineKeyset(client, f_user);
  await fundAccount(client, s_account, s_user, 100);
  await defineKeyset(client, s_user);
  await fundAccount(client, s_account, t_user, 100);
  await defineKeyset(client, t_user);
};
