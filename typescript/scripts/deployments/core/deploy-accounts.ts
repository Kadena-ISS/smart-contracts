import {
  ba_account,
  bp_account,
  ft_account,
  goa_account,
  tu_account,
  ua_account,
} from "../../utils/constants";
import { IClientWithData } from "../../utils/interfaces";
import {
  fundAccount,
  defineKeyset,
  defineMultipleKeyset,
} from "../../utils/kadena-utils";

export const deployAccounts = async (client: IClientWithData) => {
  // Deploy bridge-admin
  await defineKeyset(client, ba_account, ba_account);
  if (client.phase === "devnet") {
    await fundAccount(client, ft_account, ba_account, 1075);
  }
  if (client.phase === "testnet") {
    await fundAccount(client, ft_account, ba_account, 85);
  }
  if (client.phase === "mainnet") {
    await fundAccount(client, ft_account, ba_account, 1015);
  }

  // Deploy gas-oracle-admin
  await defineKeyset(client, ba_account, goa_account);
  await fundAccount(client, ba_account, goa_account, 5);

  // Deploy upgrade-admin
  await defineKeyset(client, ba_account, ua_account);
  await fundAccount(client, ba_account, ua_account, 5);

  // Deploy bridge-pausers
  await defineMultipleKeyset(client, ba_account, bp_account);
  await fundAccount(client, ba_account, bp_account, 5);

  // Deploy random user accounts
  if (client.phase !== "mainnet") {
    await defineKeyset(client, ba_account, tu_account);
    await fundAccount(client, ba_account, tu_account, 20);
  }
};
