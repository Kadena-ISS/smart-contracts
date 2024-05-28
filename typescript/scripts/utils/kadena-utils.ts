import { PactNumber } from "@kadena/pactjs";
import { IAccountWithKeys, ICapability, IClientWithData } from "./interfaces";
import { submitSignedTx, submitSignedTxWithDedicatedKeyset } from "./submit-tx";

export const defineKeyset = async (
  client: IClientWithData,
  sender: IAccountWithKeys
) => {
  const keysetName = sender.keysetName
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
