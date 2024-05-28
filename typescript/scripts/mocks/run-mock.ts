import { deployAccounts } from "../deployments/core/deploy-accounts";
import { deployStructs } from "../deployments/core/deploy-utils";
import { b_account, clientData, s_account } from "../utils/constants";
import {
  deployMock,
  deployVerifySPVMock,
  mockDispatch,
  mockProcess,
  runBridgeAdmin,
} from "./mock";

async function main() {

  // await deployAccounts(clientData);
  // await deployVerifySPVMock(clientData, s_account);

  // await deployStructs(clientData, s_account);
  await deployMock(clientData, b_account);
  // await mockDispatch(clientData);
  // await mockProcess(clientData);

  await runBridgeAdmin(clientData, b_account);
}

main();
