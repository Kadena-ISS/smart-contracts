import { deployAccounts } from "../deployments/deploy-accounts";
import { deployStructs } from "../deployments/deploy-utils";
import { b_account, clientData, s_account } from "../utils/constants";
import {
  deployMock,
  deployVerifySPVMock,
  mockDispatch,
  mockProcess,
  runBridgeAdmin,
} from "./mock";

async function main() {
  // await deployStructs(clientData, s_account);

  await deployAccounts(clientData);
  await deployMock(clientData, b_account);

  // await deployVerifySPVMock(clientData, s_account);
  // await mockDispatch(clientData);
  // await mockProcess(clientData);

  await runBridgeAdmin(clientData, b_account);
}

main();
