import { IKeyPair, createClient } from "@kadena/client";
import {
  IAccountWithKeys,
  IClientWithData,
  IDomains,
  INamespaces,
  INetworks,
  IUrls,
} from "./interfaces";
import { defineChain } from "viem";
import dotenv from "dotenv";
dotenv.config();

export const NAMESPACES: INamespaces = {
  devnet: "n_9b079bebc8a0d688e4b2f4279a114148d6760edf",
  testnet: "n_21bfb994661266c50e743622e5372a0ccd24f67c",
  mainnet: "n_e595727b657fbbb3b8e362a05a7bb8d12865c1ff",
};

const KDA_CHAINS: number[] = [2, 4];
export const MAX_KDA_CHAIN = 19;

export const EVM_NETWORKS: INetworks = {
  devnet: "anvil",
  testnet: "sepolia",
  mainnet: "ethereum",
};
export const KDA_NETWORKS: INetworks = {
  devnet: "development",
  testnet: "testnet04",
  mainnet: "mainnet01",
};

export const EVM_DOMAINS: IDomains = {
  devnet: 31337,
  testnet: 11155111,
  mainnet: 1,
};
export const KDA_DOMAINS: IDomains = {
  devnet: 626,
  testnet: 626,
  mainnet: 626,
};

const EVM_URLS: IUrls = {
  devnet: "http://anvil:8545",
  testnet: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
  mainnet: `https://ethereum-mainnet.core.chainstack.com/${process.env.CHAINSTACK_KEY}`,
};

const KDA_URLS: IUrls = {
  devnet: "http://kadena:8080/chainweb/0.0",
  testnet: "https://api.testnet.chainweb.com/chainweb/0.0",
  mainnet: "https://api.chainweb.com/chainweb/0.0",
};

const getClient = (phase: string, chainId: number) => {
  const URL = `${KDA_URLS[phase as keyof IUrls]}/${
    KDA_NETWORKS[phase as keyof IUrls]
  }/chain/${chainId}/pact`;
  return createClient(URL);
};

const getClientData = (chainId: number, phase: string): IClientWithData => {
  return {
    client: getClient(phase, chainId),
    chainId: chainId.toString(),
    phase: phase,
  };
};

export const getClientDatas = (phase: string): IClientWithData[] => {
  let clientDatas: IClientWithData[] = new Array<IClientWithData>(
    KDA_CHAINS.length,
  );
  for (let i: number = 0; i < KDA_CHAINS.length; i++) {
    clientDatas[i] = getClientData(KDA_CHAINS[i], phase);
  }
  return clientDatas;
};

export const bridgeNetwork = (phase: string) => {
  return defineChain({
    id: EVM_DOMAINS[phase as keyof IDomains],
    name: EVM_NETWORKS[phase as keyof IDomains],
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    },
    rpcUrls: {
      default: {
        http: [EVM_URLS[phase as keyof IUrls]],
      },
      public: {
        http: [EVM_URLS[phase as keyof IUrls]],
      },
    },
    network: String(EVM_DOMAINS[phase as keyof IDomains]),
  });
};

const keys1: IKeyPair = {
  publicKey: `${process.env.KEY1_PUBLIC}`,
  secretKey: `${process.env.KEY1_SECRET}`,
};

const keys2: IKeyPair = {
  publicKey: `${process.env.KEY2_PUBLIC}`,
  secretKey: `${process.env.KEY2_SECRET}`,
};

const keys3: IKeyPair = {
  publicKey: `${process.env.KEY3_PUBLIC}`,
  secretKey: `${process.env.KEY3_SECRET}`,
};

// test keys
const keyst: IKeyPair = {
  publicKey: "e5db35973f544642cb8b1539cb8bdf039cfe11e5f7e1127a146bd2a6d13d28c4",
  secretKey: "717cf6a5fc7aa4e046a8747f1a5831196ad51d615204c3a495d7581e24bc62be",
};

// sender00 keys
const keys0: IKeyPair = {
  publicKey: "368820f80c324bbc7c2b0610688a7da43e39f91d118732671cd9c7500ff43cca",
  secretKey: "251a920c403ae8c8f65f59142316af3c82b631fba46ddea92ee8c95035bd2898",
};

// funding account on devnet
export const fd_account: IAccountWithKeys = {
  name: "sender00",
  keysetName: "ks",
  keys: keys0,
};

// funding account on testnet and mainnet
export const ft_account: IAccountWithKeys = {
  name: `k:${keys1.publicKey}`,
  keysetName: `${keys1.publicKey}`,
  keys: keys1,
};

export const ba_account: IAccountWithKeys = {
  name: "bridge-admin",
  keysetName: "bridge-admin",
  keys: keys1,
};

export const goa_account: IAccountWithKeys = {
  name: "gas-oracle-admin",
  keysetName: "gas-oracle-admin",
  keys: keys2,
};

export const ua_account: IAccountWithKeys = {
  name: "upgrade-admin",
  keysetName: "upgrade-admin",
  keys: keys3,
};

export const bp_account: IAccountWithKeys = {
  name: "bridge-pausers",
  keysetName: "bridge-pausers",
  keys: keys1,
};

export const tu_account: IAccountWithKeys = {
  name: "k:e5db35973f544642cb8b1539cb8bdf039cfe11e5f7e1127a146bd2a6d13d28c4",
  keysetName:
    "e5db35973f544642cb8b1539cb8bdf039cfe11e5f7e1127a146bd2a6d13d28c4",
  keys: keyst,
};
