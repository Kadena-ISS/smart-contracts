import { IClient } from "@kadena/client";
import { PactNumber } from "@kadena/pactjs";
import { IAccountWithKeys, ICapability } from "./interfaces";
import { submitSignedTx, submitSignedTxWithDedicatedKeyset } from "./submit-tx";

export const defineKeyset = async (
  client: IClient,
  sender: IAccountWithKeys
) => {
  const keysetName = sender.keysetName
  console.log(`\nDefining keyset ${keysetName}`);

  const command = `(namespace "free")
  (define-keyset "free.${keysetName}" (read-keyset '${keysetName}))`;

  const result = await submitSignedTx(client, sender, command);
  console.log(result);
};

export const fundAccount = async (
  client: IClient,
  sender: IAccountWithKeys,
  receiver: IAccountWithKeys,
  amount: number
) => {
  const name = receiver.name;
  console.log(`\nFunding account: ${name}`);

  const command = `(namespace "free") (coin.transfer-create "sender00" "${name}" (read-keyset 'ks) 100.0)`;
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
  console.log(result);
};
