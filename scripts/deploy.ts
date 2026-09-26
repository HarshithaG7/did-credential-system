import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const registry = await ethers.deployContract("RevocationRegistry");

  await registry.waitForDeployment();

  console.log("RevocationRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});