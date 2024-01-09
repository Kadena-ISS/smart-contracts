import hre from "hardhat";

async function main() {

  const hyperc20 = await hre.viem.deployContract("MockHypERC20", [18, "0x7418efE4795dA40e5335263d133705a34801C35A"]);
  console.log(hyperc20)

  const recipient = 'alice';
  const amount = 10000000000000000000n;

  const encodedTokenMessage = await hyperc20.format(
    recipient,
    amount,
  );
  console.log('TokenMessage: ', encodedTokenMessage);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
