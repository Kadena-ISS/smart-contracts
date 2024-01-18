import { IClient } from "@kadena/client";
import path from "path";
import { IAccountWithKeys } from "../utils/interfaces";
import { deployModule, submitReadTx } from "../utils/submit-tx";

export const deployVerifySPVTest = async (
  client: IClient,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying VerifySPV");

  const fileName = path.join(__dirname, "../../pact/verify-spv-test.pact");
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

interface ProcessData {
  status: string;
  data: any[];
}

export const verifySPVProcess = async (client: IClient) => {
  const metadata =
    "0x0000000000000000000000002e234dae75c793f67a35089c9d99245e1c58470bf7b18e31b3dca9568a2a8660b7bc71a563a527ecfe7bb075965bc9741460f58b000000006606030837e1208f45bf393d75a0a5ef91dabe302c17a0e96be7281b84a673631850bfc937c6c28360049a3f266bc99ca52c0c4ac1fc9bdfa56b3df86e5121bd1c";
  const message =
    "0x030000000000007a690000000000000000000000007fa9385be102ac3eac297483dd6233d62b3e1496000002720000000000000000000000006c414e7a15088023e28af44ad0e1d593671e4b1500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000000000000000005616c696365000000000000000000000000000000000000000000000000000000";
  const validators = ["0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6"];
  const threshold = 1;

  const command = `(namespace "free")
    (verify-spv-mock.process "${metadata}" "${message}" ["${validators}"] ${threshold})`;
  console.log(command);

  const result = await submitReadTx(client, command);
  const parsedResult = result as unknown as ProcessData;
  console.log(parsedResult.data[1]);
};
