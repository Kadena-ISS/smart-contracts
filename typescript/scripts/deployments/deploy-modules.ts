import path from "path";
import {
  IAccountWithKeys,
  ICapability,
  IClientWithData,
  IMultisigISMCfg,
  IRemoteGasAmount,
  IRemoteGasData,
  IValidatorAnnounceCfg,
} from "../utils/interfaces";
import {
  deployModule,
  submitReadTx,
  submitSignedTx,
  submitSignedTxWithCap,
} from "../utils/submit-tx";
import { PactNumber } from "@kadena/pactjs";
import { IValidatorAnnounce } from "@hyperlane-xyz/core";

export const deployGasOracle = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  remoteGasData: IRemoteGasData
) => {
  const fileName = path.join(
    __dirname,
    "../../../pact/gas-oracle/gas-oracle.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying GasOracle");
  console.log(result);

  const initCommand = `(namespace "free")
  (gas-oracle.set-remote-gas-data-configs [
    {
        "domain": "${remoteGasData.domain}",
        "token-exchange-rate": ${remoteGasData.tokenExchangeRate},
        "gas-price": ${remoteGasData.gasPrice}
    }
    ])`;

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
    "../../../pact/validator-announce/validator-announce.pact"
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

  const fileName = path.join(__dirname, "../../../pact/ism/ism.pact");
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying ISM");
  console.log(result);

  console.log("Initializing ISM");
  let validatorsString = "";
  cfg.validators.forEach((validator) => {
    validatorsString += `"${validator} "`;
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
  treasury: string,
  remoteGasAmount: IRemoteGasAmount
) => {

  const fileName = path.join(__dirname, "../../../pact/igp/igp.pact");
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying IGP");
  console.log(result);

  const initCommand = `(namespace "free")
      (igp.initialize gas-oracle coin "treasury")
      (igp.set-remote-gas-amount {"domain": "${remoteGasAmount.domain}", "gas-amount": ${remoteGasAmount.domain}})`;

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
  console.log("Initializing IGP")
  console.log(initResult);
};

export const deployMailbox = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {

  const fileName = path.join(__dirname, "../../../pact/mailbox/mailbox.pact");
  const result = await deployModule(client, account, fileName);
  console.log("\nDeploying Mailbox");
  console.log(result);

  const initCommand = `(namespace "free")
      (mailbox.initialize ism igp)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "mailbox.ONLY_ADMIN" },
  ];
  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const deployGuards = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying Guards");

  const fileName = path.join(
    __dirname,
    "../../../pact/gas-station/guards.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

export const deployGuards1 = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying Guard1s");

  const fileName = path.join(
    __dirname,
    "../../../pact/gas-station/guards1.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

export const deployGasStation = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying GasStation");

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

  console.log(command);

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
  console.log(initResult);
};

export const deployHypERC20 = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying HypERC20");
  const fileName = path.join(
    __dirname,
    "../../../pact/hyp-erc20/hyp-erc20.pact"
  );
  const result = await deployModule(client, account, fileName);
  console.log(result);

  console.log("Initializing HypERC20");
  const initCommand = `(namespace "free")
  (hyp-erc20.initialize igp)`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "hyp-erc20.ONLY_ADMIN" },
  ];

  const initResult = await submitSignedTxWithCap(
    client,
    account,
    initCommand,
    capabilities
  );
  console.log(initResult);
};

export const enrollRemoteRouter = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  remoteRouterDomain: string,
  remoteRouterAddress: string
) => {
  console.log("Enrolling router");
  const enrollCommand = `
  (namespace "free")
  (hyp-erc20.enroll-remote-router "${remoteRouterDomain}" "${remoteRouterAddress}")`;

  const capabilities: ICapability[] = [
    { name: "coin.GAS" },
    { name: "hyp-erc20.ONLY_ADMIN" },
  ];

  const enrollResult = await submitSignedTxWithCap(
    client,
    account,
    enrollCommand,
    capabilities
  );
  console.log(enrollResult);
};

export const getRouterHash = async (client: IClientWithData) => {
  const command = `(namespace "free")
  (mailbox.get-router-hash hyp-erc20)`;
  const result = await submitReadTx(client, command);
  return result;
};

export const storeRouterToMailbox = async (
  client: IClientWithData,
  account: IAccountWithKeys,
  routerName: string
) => {
  const command = `(namespace "free")
  (mailbox.store-router ${routerName})`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const fundAccountERC20 = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  const command = `(namespace "free")
  (hyp-erc20.transfer-to "${account.name}" 500.0)`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};

export const registerAccountWithERC20 = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  const command = `(namespace "free")
  (hyp-erc20.create-account "${account.name}" (describe-keyset "free.${account.keysetName}"))
  (hyp-erc20.transfer-to "${account.name}" 500.0)`;
  const result = await submitSignedTx(client, account, command);
  console.log(result);
};
