import path from "path";

import { PactNumber } from "@kadena/pactjs";
import {
  IClientWithData,
  IAccountWithKeys,
  IRemoteGasData,
  ICapability,
  IValidatorAnnounceCfg,
  IMultisigISMCfg,
  IRemoteGasAmount,
  TxData,
} from "../../utils/interfaces";
import {
  deployModule,
  submitSignedTxWithCap,
  submitReadTx,
} from "../../utils/submit-tx";

const folderPrefix = "../../../../pact/";

export const deployGasOracle = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  remoteGasData: IRemoteGasData
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-oracle/gas-oracle.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying GasOracle");
  console.log(result);

  const initCommand = `(namespace "free")
  (gas-oracle.set-remote-gas-data
    {
        "domain": "${remoteGasData.domain}",
        "token-exchange-rate": ${remoteGasData.tokenExchangeRate},
        "gas-price": ${remoteGasData.gasPrice}
    }
  )`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "free.gas-oracle.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployValidatorAnnounce = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  cfg: IValidatorAnnounceCfg
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "validator-announce/validator-announce.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying ValidatorAnnounce");
  console.log(result);

  const initCommand = `(namespace "free")
  (validator-announce.announce "${cfg.validator}" "${cfg.storageLocation}" "${cfg.signature}")`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "validator-announce.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log("Initializing ValidatorAnnounce");
  console.log(initResult);
};

export const deployISM = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  cfg: IMultisigISMCfg
) => {
  const fileName = path.join(__dirname, folderPrefix + "ism/ism.pact");
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying ISM");
  console.log(result);

  console.log("Initializing ISM");
  let validatorsString = "";
  cfg.validators.forEach((validator) => {
    validatorsString += `"${validator}"`;
  });

  console.log(validatorsString);
  const initCommand = `(namespace "free")
    (ism.initialize [${validatorsString}] ${cfg.threshold})`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "free.ism.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployIGP = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  remoteGasAmount: IRemoteGasAmount
) => {
  const fileName = path.join(__dirname, folderPrefix + "igp/igp.pact");
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying IGP");
  console.log(result);

  const initCommand = `(namespace "free")
      (igp.initialize)
      (igp.set-remote-gas-amount {"domain": "${remoteGasAmount.domain}", "gas-amount": ${remoteGasAmount.gasAmount}})`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "free.igp.ONLY_ADMIN" },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log("Initializing IGP");
  console.log(initResult);
};

export const deployMailbox = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  const fileName = path.join(__dirname, folderPrefix + "mailbox/mailbox.pact");
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying Mailbox");
  console.log(result);

  const initCommand = `(namespace "free")
      (mailbox.initialize ism igp)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "free.mailbox.ONLY_ADMIN" },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployEmptyMailbox = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "mailbox/empty-mailbox.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying Mailbox");
  console.log(result);
};

export const deployGuards = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-station/guards.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying Guards");
  console.log(result);
};

export const deployGuards1 = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  const fileName = path.join(
    __dirname,
    folderPrefix + "gas-station/guards1.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying Guards1");
  console.log(result);
};

export const deployGasStation = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  const xChainGasStation = "kadena-xchain-gas";
  const fundAmount = "1500";

  const command = `
    (coin.transfer-create "sender00" "${xChainGasStation}" 
      (free.guards1.guard-all [ 
          (create-user-guard (coin.gas-only)) 
          (free.guards1.max-gas-price 0.00000001) 
          (free.guards1.max-gas-limit 850) ]
      )
    ${fundAmount}.0
    )
`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: [
        "sender00",
        xChainGasStation,
        new PactNumber(fundAmount).toPactDecimal(),
      ],
    },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    command,
    capabilities
  );
  console.log("\nDeploying GasStation");
  console.log(initResult);
};

export const deployFaucet = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  s_account: IAccountWithKeys
) => {
  const fileName = path.join(__dirname, folderPrefix + "faucet/faucet.pact");
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying Faucet");
  console.log(result);

  const readCommand = `(namespace "free") (coin-faucet.get-faucet-account)`;
  const faucetAccount = (await submitReadTx(
    client,
    readCommand
  )) as unknown as TxData;

  const command = `(namespace "free") (coin.transfer "sender00" "${faucetAccount.data}" 200000.0)`;
  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    {
      name: "coin.TRANSFER",
      args: [
        "sender00",
        `${faucetAccount.data}`,
        new PactNumber(200000).toPactDecimal(),
      ],
    },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    s_account,
    command,
    capabilities
  );
  console.log("Funding faucet");
  console.log(initResult);
};
