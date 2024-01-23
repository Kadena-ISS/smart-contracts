import { IClient } from "@kadena/client";
import path from "path";
import { IAccountWithKeys } from "../utils/interfaces";
import { deployModule, submitReadTx } from "../utils/submit-tx";

export const deployVerifySPVMock = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying VerifySPV");

  const fileName = path.join(__dirname, "./contracts/verify-spv-test.pact");
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

export const deployMock = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying Mock");

  const fileName = path.join(__dirname, "./contracts/mock.pact");
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

interface ProcessData {
  status: string;
  data: any;
}

export const mockDispatch = async (client: IClient) => {
  const nonce = 15;
  const destination = "31337";
  const recipient = "0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6";
  const recipient_tm = "0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6";

  const command = `(namespace "free")
    (verify-spv-mock.dispatch mock ${nonce} "${destination}" "${recipient}" "${recipient_tm}" 15.0)`;

  const params = `(namespace "free")
  (verify-spv-mock.dispatch-params mock ${nonce} "${destination}" "${recipient}" "${recipient_tm}" 15.0)`;
  const resultParams = await submitReadTx(client, params);
  const parsedResult = resultParams as unknown as ProcessData;
  console.log(parsedResult.data);

  const result = await submitReadTx(client, command);
  console.log(result);
};

export const mockProcess = async (client: IClient) => {
  const metadata =
    "0x0000000000000000000000005af5561c3017722a1fe42338cf5bfc615eac78ff271a508c6fe0999d87bef8e8f95ea00974e1e9dfa709f51630c71c348e201e9f00000000cc35e3e92c1a1979108506c67c7768047a99a8d6f57829ffb822bffaa81c1bb2597e0ddae84f945b046064306d45c0e8385485cfb777dcb16a8489073244dfeb1b";
  const message =
    "0x030000000000007a69000000000000000000000000740b133dedb75bdb58d000054e873cae6fc565fb0000027236594b7a7170444e41546d5068554a7a63354131376d4a624658482d64426b560000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000002629f66e0c530000000000000000000000000000000000000000000000000000000000000000000426b3a39346333356162316264373032343365633637303439353037376637383436333733623464633565393737396437613637333262356365623666646530353963000000000000000000000000000000000000000000000000000000000000";
  const validators = ["0x71239e00ae942b394b3a91ab229e5264ad836f6f"];
  const threshold = 1;

  const command = `(namespace "free")
    (verify-spv-mock.process "${metadata}" "${message}" ["${validators}"] ${threshold})`;

  const result = await submitReadTx(client, command);
  const parsedResult = result as unknown as ProcessData;
  console.log(parsedResult.data[1]);
};
