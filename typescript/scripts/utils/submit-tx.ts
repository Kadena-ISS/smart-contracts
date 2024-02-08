import {
  IClient,
  IKeypair,
  Pact,
  ChainId,
  IUnsignedCommand,
  createSignWithKeypair,
  ICommand,
} from "@kadena/client";
import {
  IAccountWithKeys,
  ICapability,
  IClientWithData,
  TxError,
} from "./interfaces";
import * as fs from "fs";

export const submitSignedTx = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  command: string
) => {
  const creationTime = () => Math.round(new Date().getTime() / 1000);

  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey)
    .addKeyset(sender.keysetName, "keys-all", sender.keys.publicKey)
    .setMeta({
      senderAccount: sender.name,
      chainId: client.chainId as ChainId,
      gasLimit: 100000,
      creationTime: creationTime() - 28800,
      ttl: 30000,
    })
    .setNetworkId("fast-development")
    .createTransaction();
  return signTx(client.client, sender.keys, tx);
};

export const submitSignedTxWithDedicatedKeyset = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  command: string,
  capabilities: ICapability[],
  keysetPublicKey: string
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
      chainId: client.chainId as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();
  return signTx(client.client, sender.keys, tx);
};

export const submitSignedTxWithCap = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  command: string,
  capabilities: ICapability[]
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
      chainId: client.chainId as ChainId,
      gasLimit: 40000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  return signTx(client.client, sender.keys, tx);
};

export const submitDeployContract = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  command: string
) => {
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "mock.GOVERNANCE" },
  ];

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
    .addData("init", true)
    .setMeta({
      senderAccount: sender.name,
      chainId: client.chainId as ChainId,
      gasLimit: 150000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  return signTx(client.client, sender.keys, tx);
};

export const submitReadTx = async (
  client: IClientWithData,
  commmand: string
) => {
  const tx = Pact.builder
    .execution(commmand)
    .setMeta({
      chainId: client.chainId as ChainId,
    })
    .setNetworkId("fast-development");
  const result = await client.client.local(tx.createTransaction(), {
    preflight: false,
  });
  return result.result;
};

export const deployModule = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  fileName: string
) => {
  const file = (await fs.promises.readFile(fileName)).toString();
  return await submitDeployContract(client, account, file);
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
