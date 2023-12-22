import { ICap, IClient, IKeypair } from "@kadena/client";
import * as fs from "fs";
import { submitDeployContract, submitSignedTx, submitSignedTxWithCap } from "./execute";

export const deployGasOracle = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const file = (
    await fs.promises.readFile("../pact/gas-oracle/gas-oracle.pact")
  ).toString();

  const result = await submitDeployContract(client, keys, keysetName, file);
  console.log(result);
};

export const deployValidatorAnnounce = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const file = (
    await fs.promises.readFile(
      "../pact/validator-announce/validator-announce.pact"
    )
  ).toString();

  const result = await submitDeployContract(client, keys, keysetName, file);
  console.log(result);
};

export const deployISM = async (
  client: IClient,
  keys: IKeypair,
  keysetName: string
) => {
  const file = (
    await fs.promises.readFile(
      "../pact/ism/ism.pact"
    )
  ).toString();

  const deployResult = await submitDeployContract(
    client,
    keys,
    keysetName,
    file
  );
  console.log(deployResult);

  const commandResult = `(namespace "free")
    (ism.initialize validator-announce 5)`;
  const capabilities = ["ism.ONLY_ADMIN"];

  
  const initResult = await submitSignedTxWithCap(
    client,
    keys,
    keysetName,
    capabilities,
    commandResult
  );
  console.log(initResult);
};

export const deployIGP = async (
    client: IClient,
    keys: IKeypair,
    keysetName: string
  ) => {
    const file = (
      await fs.promises.readFile(
        "../pact/igp/igp.pact"
      )
    ).toString();
  
    const deployResult = await submitDeployContract(
      client,
      keys,
      keysetName,
      file
    );
    console.log(deployResult);
  
    const commandResult = `(namespace "free")
      (igp.initialize gas-oracle coin "treasury")`;

    const capabilities = ["igp.ONLY_ADMIN"];
  
    
    const initResult = await submitSignedTxWithCap(
      client,
      keys,
      keysetName,
      capabilities,
      commandResult
    );
    console.log(initResult);
  };
  
  export const deployMailbox = async (
    client: IClient,
    keys: IKeypair,
    keysetName: string
  ) => {
    const file = (
      await fs.promises.readFile(
        "../pact/mailbox/mailbox.pact"
      )
    ).toString();
  
    const deployResult = await submitDeployContract(
      client,
      keys,
      keysetName,
      file
    );
    console.log(deployResult);
  
    const commandResult = `(namespace "free")
      (mailbox.initialize ism igp)`;
      
    const capabilities = ["mailbox.ONLY_ADMIN"];
  
    
    const initResult = await submitSignedTxWithCap(
      client,
      keys,
      keysetName,
      capabilities,
      commandResult
    );
    console.log(initResult);
  };