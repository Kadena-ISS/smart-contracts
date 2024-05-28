import { PactNumber } from "@kadena/pactjs";
import {
  IAccountWithKeys,
  ICapability,
  IClientWithData,
  TxData,
} from "./interfaces";
import {
  submitReadTx,
  submitSignedTx,
  submitSignedTxWithCap,
  submitSignedTxWithDedicatedKeyset,
} from "./submit-tx";

export const defineKeyset = async (
  client: IClientWithData,
  sender: IAccountWithKeys
) => {
  const keysetName = sender.keysetName;
  const command = `(namespace "free")
  (define-keyset "free.${sender.keysetName}" (read-keyset '${keysetName}))`;

  const result = await submitSignedTx(client, sender, command);
  console.log(`\nDefining keyset ${keysetName}`);
  console.log(result);
};

export const fundAccount = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  receiver: IAccountWithKeys,
  amount: number
) => {
  const name = receiver.name;

  const command = `(namespace "free") (coin.transfer-create "sender00" "${name}" (read-keyset 'ks) ${amount}.0)`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: ["sender00", name, new PactNumber(amount).toPactDecimal()],
    },
  ];

  const result = await submitSignedTxWithDedicatedKeyset(
    client,
    sender,
    command,
    capabilities,
    receiver.keys.publicKey
  );
  console.log(`\nFunding account: ${name}`);
  console.log(result);
};

export const fundCollateralModule = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  token: string,
  amount: number
) => {
  const readCommand = `(namespace "free") (${token}.get-collateral-account)`;
  const tx = (await submitReadTx(client, readCommand)) as unknown as TxData;
  const collateralAccount = tx.data;
  console.log(collateralAccount);

  const command = `(namespace "free") (coin.transfer "sender00" "${collateralAccount}" ${amount}.0)`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: [
        "sender00",
        collateralAccount,
        new PactNumber(amount).toPactDecimal(),
      ],
    },
  ];

  const result = await submitSignedTxWithCap(
    client,
    sender,
    command,
    capabilities
  );
  console.log(`\nFunding ${token}: ${collateralAccount}`);
  console.log(result);
};
