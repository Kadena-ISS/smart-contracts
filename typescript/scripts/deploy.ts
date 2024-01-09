import hre from "hardhat";
import { parseEther } from "viem";

async function main() {
  const hyperc20 = await hre.viem.deployContract("TestERC20", [
    18,
    "0x7418efE4795dA40e5335263d133705a34801C35A",
  ]);
  const gasPayment = await hyperc20.read.quoteGasPayment([626]);
  console.log("Quote gas payment: ", gasPayment);

  const [deployer] = await hre.viem.getWalletClients();
  await hyperc20.write.initialize([parseEther("1500"), "HYPERC20", "HYPERC20"]);

  console.log(await hyperc20.read.balanceOf([deployer.account.address]));

  await hyperc20.write.transferRemote([
    626,
    "alice",
    gasPayment,
  ]);

  console.log(await hyperc20.read.balanceOf([deployer.account.address]));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
