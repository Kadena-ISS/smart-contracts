import { IKeypair, createClient } from "@kadena/client";
import { IAccountWithKeys } from "../interfaces";

const DEVNET_URL = `http://kadena:8080/chainweb/0.0/fast-development/chain/0/pact`;
export const client = createClient(DEVNET_URL);

const s_keys: IKeypair = {
  publicKey: "368820f80c324bbc7c2b0610688a7da43e39f91d118732671cd9c7500ff43cca",
  secretKey: "251a920c403ae8c8f65f59142316af3c82b631fba46ddea92ee8c95035bd2898",
};

const b_keys: IKeypair = {
  publicKey: "f833278f8825f553c5dcde489af6b982d873947375130ab452a6b6bee071a059",
  secretKey: "9396ad2d586b90a7d4a1ab2a0cc55e9d04fc6df7ff7c9c9f41cc8c2cbe3a4d0c",
};

const user_keys: IKeypair = {
  publicKey: "94c35ab1bd70243ec670495077f7846373b4dc5e9779d7a6732b5ceb6fde059c",
  secretKey: "3b4d7398d2de5072399ada33ed46ccc4c932742a1b92ef9c39c2692b2e01e4f7",
};

export const s_account: IAccountWithKeys = {
  name: "sender00",
  keysetName: "ks",
  keys: s_keys,
};

export const b_account: IAccountWithKeys = {
  name: "bridge-admin",
  keysetName: "bridge-admin",
  keys: b_keys,
};

export const u_account: IAccountWithKeys = {
  name: "k:94c35ab1bd70243ec670495077f7846373b4dc5e9779d7a6732b5ceb6fde059c",
  keysetName:
    "a94c35ab1bd70243ec670495077f7846373b4dc5e9779d7a6732b5ceb6fde059c",
  keys: user_keys,
};
