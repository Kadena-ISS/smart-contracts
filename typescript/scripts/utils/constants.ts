import { IKeypair, createClient } from "@kadena/client";
import { IAccountWithKeys } from "./interfaces";

const DEVNET_URL = `http://kadena:8080/chainweb/0.0/fast-development/chain/0/pact`;
export const client = createClient(DEVNET_URL);

const DEVNET_URL_1 = `http://kadena:8080/chainweb/0.0/fast-development/chain/1/pact`;
export const client_1 = createClient(DEVNET_URL_1);


const s_keys: IKeypair = {
  publicKey: "368820f80c324bbc7c2b0610688a7da43e39f91d118732671cd9c7500ff43cca",
  secretKey: "251a920c403ae8c8f65f59142316af3c82b631fba46ddea92ee8c95035bd2898",
};

const b_keys: IKeypair = {
  publicKey: "f833278f8825f553c5dcde489af6b982d873947375130ab452a6b6bee071a059",
  secretKey: "9396ad2d586b90a7d4a1ab2a0cc55e9d04fc6df7ff7c9c9f41cc8c2cbe3a4d0c",
};

const first_keys: IKeypair = {
  publicKey: "94c35ab1bd70243ec670495077f7846373b4dc5e9779d7a6732b5ceb6fde059c",
  secretKey: "3b4d7398d2de5072399ada33ed46ccc4c932742a1b92ef9c39c2692b2e01e4f7",
};

const second_keys: IKeypair = {
  publicKey: "3ec1c2a86a783c160b1ff0b9ed799193128aed8bbd1f1d8917318c011831e0cf",
  secretKey: "b7c76584fe715f6a611c06a5850c1f74ce3241c3e714d98950746b2402e155a4",
};

const third_keys: IKeypair = {
  publicKey: "e5db35973f544642cb8b1539cb8bdf039cfe11e5f7e1127a146bd2a6d13d28c4",
  secretKey: "717cf6a5fc7aa4e046a8747f1a5831196ad51d615204c3a495d7581e24bc62be",
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

export const t_account: IAccountWithKeys = {
  name: "treasury",
  keysetName: "treasury",
  keys: b_keys,
};

export const f_user: IAccountWithKeys = {
  name: "k:94c35ab1bd70243ec670495077f7846373b4dc5e9779d7a6732b5ceb6fde059c",
  keysetName:
    "a94c35ab1bd70243ec670495077f7846373b4dc5e9779d7a6732b5ceb6fde059c",
  keys: first_keys,
};

export const s_user: IAccountWithKeys = {
  name: "k:3ec1c2a86a783c160b1ff0b9ed799193128aed8bbd1f1d8917318c011831e0cf",
  keysetName:
    "a3ec1c2a86a783c160b1ff0b9ed799193128aed8bbd1f1d8917318c011831e0cf",
  keys: second_keys,
};

export const t_user: IAccountWithKeys = {
  name: "k:e5db35973f544642cb8b1539cb8bdf039cfe11e5f7e1127a146bd2a6d13d28c4",
  keysetName:
    "e5db35973f544642cb8b1539cb8bdf039cfe11e5f7e1127a146bd2a6d13d28c4",
  keys: third_keys,
};