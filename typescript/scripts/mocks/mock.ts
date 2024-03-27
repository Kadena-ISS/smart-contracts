import path from "path";
import {
  IAccountWithKeys,
  ICapability,
  IClientWithData,
} from "../utils/interfaces";
import {
  deployModule,
  submitReadTx,
  submitSignedTx,
  submitSignedTxWithCap,
} from "../utils/submit-tx";

export const deployVerifySPVMock = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying VerifySPV");

  const fileName = path.join(__dirname, "./contracts/verify-spv-test.pact");
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

export const deployMock = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  console.log("\nDeploying Mock");

  const fileName = path.join(__dirname, "./contracts/mock.pact");
  const result = await deployModule(client, account, fileName);
  console.log(result);
};

function hexToBase64(hexString: string): string {
  const byteArray = new Uint8Array(
    hexString.match(/[\da-f]{2}/gi)!.map((byte) => parseInt(byte, 16)),
  );
  let base64String = Buffer.from(byteArray).toString('base64');
  base64String = base64String.replace(/=+$/, '').replace(/\//g, '_'); // Use global flag 'g' to replace all occurrences
  return base64String;
}

export const runBridgeAdmin = async (
  client: IClientWithData,
  account: IAccountWithKeys
) => {
  const encodedMessage =
    "000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000002078cb7e5caafc0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000627b2270726564223a20226b6579732d616c6c222c20226b657973223a5b226139346333356162316264373032343365633637303439353037376637383436333733623464633565393737396437613637333262356365623666646530353963225d7d000000000000000000000000000000000000000000000000000000000000";

  // const base64 = hexToBase64(encodedMessage);
  const base64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEVjkYJE9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF97InByZWQiOiJrZXlzLWFsbCIsImtleXMiOlsiZTVkYjM1OTczZjU0NDY0MmNiOGIxNTM5Y2I4YmRmMDM5Y2ZlMTFlNWY3ZTExMjdhMTQ2YmQyYTZkMTNkMjhjNCJdfQA";
  // console.log(base64);

  const command = `(namespace "free")
  (mock.mock "${base64}")`;

  const capabilities: ICapability[] = [{ name: "coin.GAS" }];

  const result = await submitSignedTxWithCap(
    client,
    account,
    command,
    capabilities,
  );

  console.log(result);
};

interface ProcessData {
  status: string;
  data: any;
}

export const mockDispatch = async (client: IClientWithData) => {
  const nonce = 15;
  const destination = "31337";
  const recipient = "0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6";
  const recipient_tm = "0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6";

  console.log("Dispatch");
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

export const mockProcess = async (client: IClientWithData) => {
  const metadata =
    "0x0000000000000000000000002e234dae75c793f67a35089c9d99245e1c58470b6d1257af3b899a1ffd71849d9f5534753accbe25f85983aac343807a9184bd100000000060ab9a1a8c880698ad56cc32210ba75f3f73599afca28e85e3935d9c3252c7f353fec4452218367116ae5cb0df978a21b39a4701887651fff1d6058d629521641c";
  const message =
    "0x030000000000007a690000000000000000000000007fa9385be102ac3eac297483dd6233d62b3e14960000027236594b7a7170444e41546d5068554a7a63354131376d4a624658482d64426b56000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000d7f91b4bdd0440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000426b3a39346333356162316264373032343365633637303439353037376637383436333733623464633565393737396437613637333262356365623666646530353963000000000000000000000000000000000000000000000000000000000000";
  const validators = ["0xab36e79520d85F36FE5e2Ca33C29CfE461Eb48C6"];
  const threshold = 1;

  console.log("Process");
  const command = `(namespace "free")
    (verify-spv-mock.process "${metadata}" "${message}" ["${validators}"] ${threshold})`;

  const result = await submitReadTx(client, command);
  const parsedResult = result as unknown as ProcessData;
  console.log(parsedResult);
  // console.log(parsedResult.data[1]);
};
