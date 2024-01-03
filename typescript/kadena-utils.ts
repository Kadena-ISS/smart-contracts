import {
  ChainId,
  IClient,
  ICommand,
  IKeypair,
  IUnsignedCommand,
  Pact,
  createSignWithKeypair,
} from "@kadena/client";
import { PactNumber } from '@kadena/pactjs';

export interface IAccountWithPublicKey {
  name: string;
  publicKey: string;
}

export interface ICapability {
  name: string;
  args?: any[];
}

export const defineKeyset = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string, 
  sender: string
) => {
  const command = `(namespace "free")
  (define-keyset "free.${keysetName}" (read-keyset '${keysetName}))`;

  const result = await submitSignedTx(client, keys, keysetName, command, sender);
  console.log(result);
};

export const fundAccount = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string,
  account: IAccountWithPublicKey,
  amount: number
) => {
  const name = account.name;
  const publicKey = account.publicKey;

  console.log(`Funding account: ${name}\nPublic Key: ${publicKey}`);

  const command = `(namespace "free") (coin.transfer-create "sender00" "${name}" (read-keyset 'ks) 100.0)`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "coin.TRANSFER", args: ["sender00", name, new PactNumber(amount).toPactDecimal()] },
  ];
  const result = await submitSignedTxWithCap(
    client,
    keys,
    keysetName,
    capabilities,
    command
  );
  console.log(result);
};

export const submitSignedTx = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string,
  command: string,
  sender: string
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(keys.publicKey)
    .addKeyset(keysetName, "keys-all", keys.publicKey)
    .setMeta({
      senderAccount: sender,
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  console.log(tx.cmd)

  return signTx(client, keys, tx);
};

export const submitSignedTxWithCap = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string,
  capabilities: ICapability[],
  command: string,
  sender: string = "sender00"
) => {
  
  const tx = Pact.builder
    .execution(command)
    .addSigner(keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args ? withCapability(obj.name, ...obj.args) : withCapability(obj.name)
      );
    })
    .addKeyset(keysetName, "keys-all", keys.publicKey)
    .setMeta({
      senderAccount: sender,
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();
  return signTx(client, keys, tx);
};

export const submitDeployContract = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string,
  command: string,
  sender: string = "sender00"
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(keys.publicKey)
    .addKeyset(keysetName, "keys-all", keys.publicKey)
    .addData("init", true)
    .setMeta({
      senderAccount: sender,
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  return signTx(client, keys, tx);
};

interface TxError {
  message: string;
}

const signTx = async (
  client: IClient,
  keys: IKeypair,
  tx: IUnsignedCommand
) => {
  const sign = createSignWithKeypair([keys]);
  const signedTx = (await sign(tx)) as ICommand;
  const signedResult = await client.submit(signedTx);
  const listen = await client.listen(signedResult);

  if (listen.result.status == "failure") {
    const error = listen.result.error as unknown as TxError;
    return { status: "failure", message: error.message };
  }
  return listen.result;
};
