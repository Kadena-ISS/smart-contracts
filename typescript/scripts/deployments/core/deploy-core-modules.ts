import path from "path";
import { PactNumber } from "@kadena/pactjs";
import {
  IClientWithData,
  IAccountWithKeys,
  ICapability,
  TxData,
  IDomains,
  IRemoteGasAmount,
  IRemoteGasData,
  IValidatorAnnounceCfg,
  IMultisigISMCfg,
} from "../../utils/interfaces";
import {
  deployModule,
  submitSignedTxWithCap,
  submitReadTx,
} from "../../utils/submit-tx";
import { EVM_DOMAINS, NAMESPACES } from "../../utils/constants";

const folderPrefix = "../../../../pact/";

export const deployGasOracle = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-oracle/gas-oracle.pact",
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying GasOracle");
  console.log(result);
};

export const setupGasOracle = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const remoteGasData: IRemoteGasData = {
    domain: EVM_DOMAINS[client.phase as keyof IDomains],
    tokenExchangeRate: "0.0002999",
    gasPrice: "0.000000046",
  };

  const initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
  (gas-oracle.set-remote-gas-data
    {
        "domain": ${remoteGasData.domain},
        "token-exchange-rate": ${remoteGasData.tokenExchangeRate},
        "gas-price": ${remoteGasData.gasPrice}
    }
  )`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.gas-oracle.ONLY_ORACLE_ADMIN`,
    },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log(initResult);
};

export const deployValidatorAnnounce = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  let validatorCfg: IValidatorAnnounceCfg[] = [
    {
      validator: "0xdd3d6e30453490b027eb32a299e6779efc29f0d3",
      storageLocation: "file:///tmp/hyperlane-validator-signatures-kadena",
      signature:
        "0x5719b6fc770f6983a28f02c10b37605b2c876ffbda45840e66750622859c25b151b0930597a6cda1bed8e2550be3dd0e0fee00494e8b465982bdad42ae13b8081b",
    },
  ];
  if (client.phase === "mainnet") {
    validatorCfg = [
      {
        validator: "0x31d0aa53e7ed9f22b4adfdaa35d2ee0f87f525bf",
        storageLocation: "s3://kadena-validator-1-signatures/us-east-1",
        signature: "",
      },
      {
        validator: "0x19f8d12896cc59fe8b8a22eaee30dd41eed29b65",
        storageLocation: "s3://kadena-validator-2-signatures/us-east-1",
        signature: "",
      },
      {
        validator: "0xd0580422b83e07ab502f79736bd2e62a8e9f5b06",
        storageLocation: "s3://kadena-validator-3-signatures/us-east-1",
        signature: "",
      },
    ];
  }

  const fileName = path.join(
    __dirname,
    folderPrefix + "validator-announce/validator-announce.pact",
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying ValidatorAnnounce");
  console.log(result);

  let initCommand: string = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
  (validator-announce.announce "${validatorCfg[0].validator}" "${validatorCfg[0].storageLocation}" "${validatorCfg[0].signature}")`;
  if (client.phase === "mainnet") {
    initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
  (validator-announce.announce "${validatorCfg[0].validator}" "${validatorCfg[0].storageLocation}" "${validatorCfg[0].signature}")
  (validator-announce.announce "${validatorCfg[1].validator}" "${validatorCfg[1].storageLocation}" "${validatorCfg[1].signature}")
  (validator-announce.announce "${validatorCfg[2].validator}" "${validatorCfg[2].storageLocation}" "${validatorCfg[2].signature}")`;
  }

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.validator-announce.ONLY_ADMIN`,
    },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log("Initializing ValidatorAnnounce");
  console.log(initResult);
};

export const deployISM = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  let multisigISMCfg: IMultisigISMCfg = {
    validators: ["0x71239e00ae942b394b3a91ab229e5264ad836f6f"],
    threshold: 1,
  };
  if (client.phase === "mainnet") {
    multisigISMCfg = {
      validators: [
        "0x3c92b1c956548226469c86b1a3258d76e8de5336",
        "0x985bd70a66341b032aa295da0b80121eb5df5cc4",
        "0x764c997799f6af32f1a42d0c51c88a7d4e398631",
      ],
      threshold: 3,
    };
  }

  const fileName = path.join(
    __dirname,
    folderPrefix + "ism/merkle-tree-ism.pact",
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying ISM");
  console.log(result);

  let validatorsString = "";
  multisigISMCfg.validators.forEach((validator) => {
    validatorsString += `"${validator}"`;
  });

  const initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
    (merkle-tree-ism.initialize [${validatorsString}] ${multisigISMCfg.threshold})`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.merkle-tree-ism.ONLY_ADMIN`,
    },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log("Initializing ISM");
  console.log(initResult);
};

export const deployISMRouting = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "ism/domain-routing-ism.pact",
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying ISM Routing");
  console.log(result);

  const initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
    (domain-routing-ism.initialize [${
      EVM_DOMAINS[client.phase as keyof IDomains]
    }] [merkle-tree-ism])`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.domain-routing-ism.ONLY_ADMIN`,
    },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log("Initializing ISM Routing");
  console.log(initResult);
};

export const deployIGP = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const remoteGasAmount: IRemoteGasAmount = {
    domain: EVM_DOMAINS[client.phase as keyof IDomains],
    gasAmount: "200000.0",
  };

  const fileName = path.join(__dirname, folderPrefix + "igp/igp.pact");
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying IGP");
  console.log(result);

  const initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
      (igp.initialize)
      (igp.set-remote-gas-amount {"domain": ${remoteGasAmount.domain}, "gas-amount": ${remoteGasAmount.gasAmount}})`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: `${NAMESPACES[client.phase as keyof IDomains]}.igp.ONLY_ADMIN` },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log("Initializing IGP");
  console.log(initResult);
};

export const deployMerkleTreeHook = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "merkle/merkle-tree-hook.pact",
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying Merkle Tree Hook");
  console.log(result);

  const initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
      (merkle-tree-hook.initialize)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.merkle-tree-hook.ONLY_ADMIN`,
    },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log(initResult);
};

export const defineHook = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
      (mailbox.define-hook merkle-tree-hook)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.mailbox.ONLY_ADMIN`,
    },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log(initResult);
};

export const deployMailbox = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(__dirname, folderPrefix + "mailbox/mailbox.pact");
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying Mailbox");
  console.log(result);

  const initCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}")
      (mailbox.initialize)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: `${NAMESPACES[client.phase as keyof IDomains]}.mailbox.ONLY_ADMIN`,
    },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    account,
    initCommand,
    capabilities,
  );
  console.log(initResult);
};

export const deployGuards = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-station/guards.pact",
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying Guards");
  console.log(result);
};

export const deployGuards1 = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-station/guards1.pact",
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying Guards1");
  console.log(result);
};

export const deployGasStation = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-station/kinesis-gas-station.pact",
  );
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying Gas Station");
  console.log(result);
};

export const deployFaucet = async (
  client: IClientWithData,
  sender: IAccountWithKeys,
  account: IAccountWithKeys,
) => {
  const fileName = path.join(__dirname, folderPrefix + "faucet/faucet.pact");
  const result = await deployModule(client, sender, account, fileName);
  console.log("\nDeploying Faucet");
  console.log(result);

  const readCommand = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}") (coin-faucet.get-faucet-account)`;
  const faucetAccount = (await submitReadTx(
    client,
    readCommand,
  )) as unknown as TxData;

  const amount = "30";

  const command = `(namespace "${NAMESPACES[client.phase as keyof IDomains]}") (coin.transfer "${sender.name}" "${faucetAccount.data}" ${amount}.0)`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: [
        `${sender.name}`,
        `${faucetAccount.data}`,
        new PactNumber(amount).toPactDecimal(),
      ],
    },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    sender,
    sender,
    command,
    capabilities,
  );
  console.log("Funding faucet");
  console.log(initResult);
};
