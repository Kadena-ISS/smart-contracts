import {
  IClient,
  IKeypair,
  Pact,
  ChainId,
  IUnsignedCommand,
  createSignWithKeypair,
  ICommand,
} from "@kadena/client";
import { IAccountWithKeys, ICapability, TxError } from "./interfaces";

export const submitSignedTx = async (
  client: IClient,
  sender: IAccountWithKeys,
  command: string,
) => {
  const creationTime = () => Math.round(new Date().getTime() / 1000);

  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey)
    .addKeyset(sender.keysetName, "keys-all", sender.keys.publicKey)
    .setMeta({
      senderAccount: sender.name,
      chainId: "0" as ChainId,
      gasLimit: 100000,
      creationTime: creationTime() - 28800,
      ttl: 30000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  console.log(tx.cmd);

  return signTx(client, sender.keys, tx);
};

export const submitSignedTxWithDedicatedKeyset = async (
  client: IClient,
  sender: IAccountWithKeys, 
  command: string,
  capabilities: ICapability[],
  keysetPublicKey: string,
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name)
      );
    })
    .addKeyset(sender.keysetName, "keys-all", keysetPublicKey)
    .setMeta({
      senderAccount: sender.name,
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();
  console.log(tx.cmd);
  return signTx(client, sender.keys, tx);
};

export const submitSignedTxWithCap = async (
  client: IClient,
  sender: IAccountWithKeys,
  command: string,
  capabilities: ICapability[],
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name)
      );
    })
    .addKeyset(sender.keysetName, "keys-all", sender.keys.publicKey)
    .setMeta({
      senderAccount: sender.name,
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();
  console.log(tx.cmd);
  return signTx(client, sender.keys, tx);
};

export const submitDeployContract = async (
  client: IClient,
  sender: IAccountWithKeys,
  command: string,
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey)
    .addKeyset(sender.keysetName, "keys-all", sender.keys.publicKey)
    .addData("init", true)
    .setMeta({
      senderAccount: sender.name,
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  return signTx(client, sender.keys, tx);
};

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
