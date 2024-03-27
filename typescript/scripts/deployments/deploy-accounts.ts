import { s_account, b_account, t_account, f_user } from "../utils/constants";
import { IClientWithData } from "../utils/interfaces";
import { fundAccount, defineKeyset } from "../utils/kadena-utils";

export const deployAccounts = async (client: IClientWithData) => {
  // Deploy bridge-admin
  await fundAccount(client, s_account, b_account, 10000);
  await defineKeyset(client, b_account);
  // Deploy treasury
  await fundAccount(client, s_account, t_account, 100);
  await defineKeyset(client, t_account);

  // Deploy user accounts
  await fundAccount(client, s_account, f_user, 100);
  await defineKeyset(client, f_user);
};
