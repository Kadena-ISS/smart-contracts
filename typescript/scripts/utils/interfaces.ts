import { IClient, IKeypair } from "@kadena/client";

export interface TxError {
  message: string;
}

export interface TxData {
  data: string;
}

export interface IClientWithData {
  client: IClient;
  chainId: string;
}

export interface IAccountWithKeys {
  name: string;
  keysetName: string;
  keys: IKeypair;
}

export interface ICapability {
  name: string;
  args?: any[];
}

export interface IRemoteGasData {
  domain: string;
  tokenExchangeRate: string;
  gasPrice: string;
}

export interface IValidatorAnnounceCfg {
  validator: string;
  storageLocation: string;
  signature: string;
}

export interface IMultisigISMCfg {
  validators: string[];
  threshold: number;
}

export interface IRemoteGasAmount {
  domain: string;
  gasAmount: string;
}

export enum TokenType {
  Collateral = "Collateral",
  Synthetic = "Synthetic",
}

export type WarpRouteCfg = {};
