import { expect } from "chai";
import { network } from "hardhat";

describe("RevocationRegistry", function () {
  it("should revoke a credential", async function () {
    const { ethers } = await network.connect();

    const registry = await ethers.deployContract("RevocationRegistry");

    const credentialId = ethers.keccak256(
      ethers.toUtf8Bytes("VC-001")
    );

    expect(await registry.isRevoked(credentialId)).to.equal(false);

    await registry.revokeCredential(credentialId);

    expect(await registry.isRevoked(credentialId)).to.equal(true);
  });
});