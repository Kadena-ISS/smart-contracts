import { deployStructs } from "../deploy-utils";
import { client, s_account } from "../utils/constants";
import { deployMock, deployVerifySPVMock, mockDispatch } from "./mock";

async function main() {
  await deployStructs(client, s_account);
  await deployMock(client, s_account);
  await deployVerifySPVMock(client, s_account);
  await mockDispatch(client);
}

main();
