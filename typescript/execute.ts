import {
  ChainId,
  ICap,
  IClient,
  ICommand,
  IKeypair,
  Pact,
  createSignWithKeypair,
} from "@kadena/client";

export const submitSignedTx = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string,
  command: string
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(keys.publicKey)
    .addKeyset(keysetName, "keys-all", keys.publicKey)
    .setMeta({
      senderAccount: "sender00",
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  const sign = createSignWithKeypair([keys]);
  const signedTx = (await sign(tx)) as ICommand;
  const signedResult = await client.submit(signedTx);
  return await client.listen(signedResult);
};

export const submitSignedTxWithCap = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string,
  capabilities: string[],
  command: string
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(keys.publicKey, (withCapability) => {
      return capabilities.map((str) => withCapability(str));
    })
    .addKeyset(keysetName, "keys-all", keys.publicKey)
    .setMeta({
      senderAccount: "sender00",
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  const sign = createSignWithKeypair([keys]);
  const signedTx = (await sign(tx)) as ICommand;
  const signedResult = await client.submit(signedTx);
  return await client.listen(signedResult);
};

export const submitDeployContract = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string,
  command: string
) => {
  const tx = Pact.builder
    .execution(command)
    .addSigner(keys.publicKey)
    .addKeyset(keysetName, "keys-all", keys.publicKey)
    .addData("init", true)
    .setMeta({
      senderAccount: "sender00",
      chainId: "0" as ChainId,
      gasLimit: 100000,
    })
    .setNetworkId("fast-development")
    .createTransaction();

  const sign = createSignWithKeypair([keys]);
  const signedTx = (await sign(tx)) as ICommand;
  const signedResult = await client.submit(signedTx);
  return await client.listen(signedResult);
};
