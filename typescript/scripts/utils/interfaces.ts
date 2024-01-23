import { IKeypair } from "@kadena/client";

export interface TxError {
  message: string;
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
