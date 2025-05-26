import { PactNumber } from "@kadena/pactjs";
import {
  IAccountWithKeys,
  ICapability,
  IClientWithData,
  IDomains,
} from "./interfaces";
import {
  submitReadTx,
  submitSignedTx,
  submitSignedTxWithCap,
  submitSignedTxWithCapWithData,
  submitSignedTxWithData,
} from "./submit-tx";
import { exit } from "process";
import { NAMESPACES } from "./constants";

export const buyGas = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  // When deploying on testnet bridge admin must have 100 coins on each chain
  // Obtain through kadena faucet
  const amount = "1076";

  const command = `(coin.transfer-create "${sender.name}" "k:${keyset.keys.publicKey}" (read-keyset "${sender.keysetName}") ${amount}.0)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: [
        `${sender.name}`,
        `k:${keyset.keys.publicKey}`,
        new PactNumber(amount).toPactDecimal(),
      ],
    },
  ];

  const result = await submitSignedTxWithCapWithData(
    client,
    sender,
    keyset,
    command,
    capabilities,
    sender.keysetName,
  );

  console.log(
    `Funding account: k:${keyset.keys.publicKey}\nPublic Key: ${keyset.keys.publicKey}`,
  );
  console.log(result);
};

export const createNamespace = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
): Promise<string> => {
  const command = `(let ((ns-name (ns.create-principal-namespace (read-keyset "${sender.keysetName}"))))
    (define-namespace ns-name (read-keyset "${sender.keysetName}") (read-keyset "${sender.keysetName}")))`;

  const result = await submitSignedTx(client, sender, keyset, command);
  console.log(`\nCreating namespace`);
  console.log(result);

  if (result.status === "success" && "data" in result) {
    const namespaceMatch = result.data
      .toString()
      .match(/Namespace defined: (\S+)/);
    if (namespaceMatch) {
      return namespaceMatch[1];
    }
  }
  console.error("Failed to create namespace");
  exit(1);
};

export const defineKeyset = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
  (define-keyset "${NAMESPACES[client.phase as keyof IDomains]}.${keyset.keysetName}" (read-keyset "${keyset.keysetName}"))`;

  const result = await submitSignedTx(client, sender, keyset, command);
  console.log(`\nDefining keyset ${keyset.keysetName}`);
  console.log(result);
};

export const defineMultipleKeyset = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
  (define-keyset "${NAMESPACES[client.phase as keyof IDomains]}.${keyset.keysetName}" (read-keyset "${keyset.keysetName}"))`;

  const result = await submitSignedTxWithData(
    client,
    sender,
    keyset,
    command,
    keyset.keysetName,
  );
  console.log(`\nDefining keyset ${keyset.keysetName}`);
  console.log(result);
};

export const fundAccount = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  amount: number,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}") 
  (coin.transfer-create "${sender.name}" "${keyset.name}" (read-keyset "${keyset.keysetName}") ${amount}.0)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: [
        `${sender.name}`,
        `${keyset.name}`,
        new PactNumber(amount).toPactDecimal(),
      ],
    },
  ];

  let result;
  if (client.phase === "devnet") {
    result = await submitSignedTxWithCapWithData(
      client,
      sender,
      keyset,
      command,
      capabilities,
      "",
    );
  } else {
    result = await submitSignedTxWithCap(
      client,
      sender,
      keyset,
      command,
      capabilities,
    );
  }

  console.log(`\nFunding account: ${keyset.name}`);
  console.log(result);
};

export const createGasStation = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
): Promise<string> => {
  const gs_guard = `(${NAMESPACES[client.phase as keyof IDomains]}.kinesis-gas-station.create-gas-payer-guard)`;
  const command = `(create-principal ${gs_guard})`;

  const result = await submitSignedTx(client, sender, account, command);
  console.log("\nCreating GasStation");
  console.log(result);

  if (result.status === "success" && "data" in result) {
    const principalMatch = result.data.toString();
    if (principalMatch) {
      return principalMatch;
    }
  }
  console.error("Failed to create principal");
  exit(1);
};

export const fundGasStation = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
  xChainGasStation: string,
) => {
  let amount = "1000";
  if (client.phase === "testnet") {
    amount = "20";
  }
  const gs_guard = `(${NAMESPACES[client.phase as keyof IDomains]}.kinesis-gas-station.create-gas-payer-guard)`;
  const command = `(coin.transfer-create "${sender.name}" "${xChainGasStation}" ${gs_guard} ${amount}.0)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: [
        `${sender.name}`,
        xChainGasStation,
        new PactNumber(amount).toPactDecimal(),
      ],
    },
  ];

  const result = await submitSignedTxWithCap(
    client,
    sender,
    account,
    command,
    capabilities,
  );
  console.log("\nFunding GasStation");
  console.log(result);
};

export const getDeployedHash = async (
  client: IClientWithData,
  moduleName: string,
) => {
  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
  (at "hash" (describe-module "${NAMESPACES[client.phase as keyof IDomains]}.${moduleName}"))`;

  const result = await submitReadTx(client, command);
  return result;
};
