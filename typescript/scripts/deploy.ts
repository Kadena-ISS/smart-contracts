import hre from "hardhat";
import {
  createTestClient,
  http,
  parseEther,
  publicActions,
  walletActions,
} from "viem";
import { hardhat } from "viem/chains";

async function main() {
  const client = createTestClient({
    chain: hardhat,
    mode: "hardhat",
    transport: http(),
  })
    .extend(publicActions)
    .extend(walletActions);

  const mailboxAddress:`0x${string}` = "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2";

  const bytecode = await client.getBytecode({
    address: mailboxAddress,
  });
  console.log(bytecode?.length);

  const hyperc20 = await hre.viem.deployContract("TestERC20", [
    18,
    mailboxAddress,
  ]);
  const gasPayment = await hyperc20.read.quoteGasPayment([626]);
  console.log("Quote gas payment: ", gasPayment);

  const [deployer] = await hre.viem.getWalletClients();
  await hyperc20.write.initialize([parseEther("1500"), "HYPERC20", "HYPERC20"]);

  console.log(await hyperc20.read.balanceOf([deployer.account.address]));

  await hyperc20.write.transferRemote([626, "alice", gasPayment]);

  console.log(await hyperc20.read.balanceOf([deployer.account.address]));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
