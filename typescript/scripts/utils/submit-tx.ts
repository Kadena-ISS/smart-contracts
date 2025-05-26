import path from "path";
import {
  IClient,
  IKeyPair,
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
  INetworks,
  TxData,
  TxError,
} from "./interfaces";
import * as fs from "fs";
import { KDA_NETWORKS } from "./constants";
import { readFile } from "fs/promises";
import { getDeployedHash } from "./kadena-utils";
import { createNamespaceFile } from "../generator/generate-modules";

export const submitSignedTx = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  command: string,
) => {
  const creationTime = () => Math.round(new Date().getTime() / 1000);

  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey)
    .addKeyset(keyset.keysetName, "keys-all", keyset.keys.publicKey)
    .setMeta({
      senderAccount: `k:${sender.keys.publicKey}`,
      chainId: client.chainId as ChainId,
      gasLimit: 100000,
      creationTime: creationTime() - 28800,
      ttl: 30000,
    })
    .setNetworkId(KDA_NETWORKS[client.phase as keyof INetworks])
    .createTransaction();
  return signTx(client.client, sender.keys, tx);
};

export const submitSignedTxWithCap = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  command: string,
  capabilities: ICapability[],
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name),
      );
    })
    .addKeyset(keyset.keysetName, "keys-all", keyset.keys.publicKey)
    .setMeta({
      senderAccount: `k:${sender.keys.publicKey}`,
      chainId: client.chainId as ChainId,
      gasLimit: 40000,
    })
    .setNetworkId(KDA_NETWORKS[client.phase as keyof INetworks])
    .createTransaction();

  return signTx(client.client, sender.keys, tx);
};

export const submitSignedTxWithData = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  command: string,
  data: string,
) => {
  const creationTime = () => Math.round(new Date().getTime() / 1000);

  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey)
    .addKeyset(keyset.keysetName, "keys-all", keyset.keys.publicKey)
    .addData(data, {
      keys: [keyset.keys.publicKey, "otherkey", "otherkey"],
      pred: "keys-any",
    })
    .setMeta({
      senderAccount: sender.name,
      chainId: client.chainId as ChainId,
      gasLimit: 100000,
      creationTime: creationTime() - 28800,
      ttl: 30000,
    })
    .setNetworkId(KDA_NETWORKS[client.phase as keyof INetworks])
    .createTransaction();
  return signTx(client.client, sender.keys, tx);
};

export const submitSignedTxWithCapWithData = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  command: string,
  capabilities: ICapability[],
  data: string,
) => {
  const creationTime = () => Math.round(new Date().getTime() / 1000);

  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name),
      );
    })
    .addKeyset(keyset.keysetName, "keys-all", keyset.keys.publicKey)
    .addData(data, {
      keys: [keyset.keys.publicKey],
      pred: "keys-all",
    })
    .setMeta({
      senderAccount: sender.name,
      chainId: client.chainId as ChainId,
      gasLimit: 100000,
      creationTime: creationTime() - 28800,
      ttl: 30000,
    })
    .setNetworkId(KDA_NETWORKS[client.phase as keyof INetworks])
    .createTransaction();
  return signTx(client.client, sender.keys, tx);
};

export const submitDeployContract = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  command: string,
) => {
  const capabilities: ICapability[] = [
    // { name: "coin.GAS" },
    // { name: "mock.GOVERNANCE" },
  ];

  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name),
      );
    })
    .addKeyset(keyset.keysetName, "keys-all", keyset.keys.publicKey)
    .addData("init", true)
    .addData("upgrade", false)
    .setMeta({
      senderAccount: `k:${sender.keys.publicKey}`,
      chainId: client.chainId as ChainId,
      gasLimit: 150000,
    })
    .setNetworkId(KDA_NETWORKS[client.phase as keyof INetworks])
    .createTransaction();

  return signTx(client.client, sender.keys, tx);
};

export const submitUpgradeContract = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  command: string,
) => {
  const capabilities: ICapability[] = [
    // { name: "coin.GAS" },
    // { name: "mock.GOVERNANCE" },
  ];

  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name),
      );
    })
    .addSigner(keyset.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name),
      );
    })
    .addKeyset(sender.keysetName, "keys-all", sender.keys.publicKey)
    .addKeyset(keyset.keysetName, "keys-all", keyset.keys.publicKey)
    .addData("init", false)
    .addData("upgrade", true)
    .setMeta({
      senderAccount: sender.keysetName,
      chainId: client.chainId as ChainId,
      gasLimit: 150000,
    })
    .setNetworkId(KDA_NETWORKS[client.phase as keyof INetworks])
    .createTransaction();

  return signTxSeveralSigners(client.client, [sender.keys, keyset.keys], tx);
};

export const submitVerifyContract = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  command: string,
) => {
  const capabilities: ICapability[] = [
    // { name: "coin.GAS" },
    // { name: "mock.GOVERNANCE" },
  ];

  const tx = Pact.builder
    .execution(command)
    .addSigner(sender.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name),
      );
    })
    .addSigner(keyset.keys.publicKey, (withCapability) => {
      return capabilities.map((obj) =>
        obj.args
          ? withCapability(obj.name, ...obj.args)
          : withCapability(obj.name),
      );
    })
    .addKeyset(sender.keysetName, "keys-all", sender.keys.publicKey)
    .addKeyset(keyset.keysetName, "keys-all", keyset.keys.publicKey)
    .addData("init", false)
    .addData("upgrade", true)
    .setMeta({
      senderAccount: sender.keysetName,
      chainId: client.chainId as ChainId,
      gasLimit: 150000,
    })
    .setNetworkId(KDA_NETWORKS[client.phase as keyof INetworks])
    .createTransaction();

  return resultTx(client.client, [sender.keys, keyset.keys], tx);
};

export const submitReadTx = async (
  client: IClientWithData,
  commmand: string,
) => {
  const tx = Pact.builder
    .execution(commmand)
    .setMeta({
      chainId: client.chainId as ChainId,
    })
    .setNetworkId(KDA_NETWORKS[client.phase as keyof INetworks]);
  const result = await client.client.local(tx.createTransaction(), {
    preflight: false,
  });
  return result.result;
};

export const deployModuleDirectly = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  file: string,
) => {
  const resultFile = await createNamespaceFile(client, file);
  return await submitDeployContract(client, sender, keyset, resultFile);
};

export const upgradeModuleDirectly = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  file: string,
) => {
  const resultFile = await createNamespaceFile(client, file);
  return await submitUpgradeContract(client, sender, keyset, resultFile);
};

export const verifyModuleDirectly = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  file: string,
  moduleName: string,
) => {
  let resultFile = await createNamespaceFile(client, file);
  const index = resultFile.indexOf('(if (read-msg "init")');
  if (index !== -1) {
    resultFile = resultFile.slice(0, index);
  }
  const submitTx = (await submitVerifyContract(
    client,
    sender,
    keyset,
    resultFile,
  )) as unknown as TxData;
  const array = submitTx.data.split(" ");
  const repoHash = array[array.length - 1];

  const mainnetHash = (
    (await getDeployedHash(client, moduleName)) as unknown as TxData
  ).data;

  if (repoHash === mainnetHash) return "Verification successfull";
  else return "Verification failed";
};

export const deployModule = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  fileName: string,
) => {
  const file = (await fs.promises.readFile(fileName)).toString();
  const resultFile = await createNamespaceFile(client, file);
  return await submitDeployContract(client, sender, keyset, resultFile);
};

export const upgradeModule = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  fileName: string,
) => {
  const file = (await fs.promises.readFile(fileName)).toString();
  const resultFile = await createNamespaceFile(client, file);
  return await submitUpgradeContract(client, sender, keyset, resultFile);
};

export const verifyModule = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  keyset: IAccountWithKeys,
  moduleFolder: string,
  moduleName: string,
) => {
  const folderPrefix = "../../../pact/";
  const fileName = path.join(
    __dirname,
    folderPrefix + moduleFolder + "/" + moduleName + ".pact",
  );
  const file = (await readFile(fileName)).toString();
  let resultFile = await createNamespaceFile(client, file);
  const index = resultFile.indexOf('(if (read-msg "init")');
  if (index !== -1) {
    resultFile = resultFile.slice(0, index);
  }
  const submitTx = (await submitVerifyContract(
    client,
    sender,
    keyset,
    resultFile,
  )) as unknown as TxData;
  const array = submitTx.data.split(" ");
  const repoHash = array[array.length - 1];

  const mainnetHash = (
    (await getDeployedHash(client, moduleName)) as unknown as TxData
  ).data;

  if (repoHash === mainnetHash) return "Verification successfull";
  else return "Verification failed";
};

const signTx = async (
  client: IClient,
  keys: IKeyPair,
  tx: IUnsignedCommand,
) => {
  const sign = createSignWithKeypair([keys]);
  const signedTx = (await sign(tx)) as ICommand;
  const signedResult = await client.submit(signedTx);
  const listen = await client.pollOne(signedResult);

  if (listen.result.status == "failure") {
    const error = listen.result.error as unknown as TxError;
    return { status: "failure", message: error.message };
  }
  return listen.result;
};

const signTxSeveralSigners = async (
  client: IClient,
  keys: IKeyPair[],
  tx: IUnsignedCommand,
) => {
  const sign = createSignWithKeypair(keys);
  const signedTx = (await sign(tx)) as ICommand;
  const signedResult = await client.submit(signedTx);
  const listen = await client.pollOne(signedResult);

  if (listen.result.status == "failure") {
    const error = listen.result.error as unknown as TxError;
    return { status: "failure", message: error.message };
  }
  return listen.result;
};

const resultTx = async (
  client: IClient,
  keys: IKeyPair[],
  tx: IUnsignedCommand,
) => {
  const sign = createSignWithKeypair(keys);
  const signedTx = (await sign(tx)) as ICommand;
  const signedResult = await client.preflight(signedTx);

  if (signedResult.result.status == "failure") {
    const error = signedResult.result.error as unknown as TxError;
    return { status: "failure", message: error.message };
  }
  return signedResult.result;
};
