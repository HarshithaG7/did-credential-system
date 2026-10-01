const { EthrDID } = require("ethr-did");
const { createVerifiablePresentationJwt } = require("did-jwt-vc");
const { ethers } = require("ethers");
const fs = require("fs");

// Generate (once) or load a student key pair
function getOrCreateStudentIdentity() {
  const file = "./student-identity.json";
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file));
  }
  const wallet = ethers.Wallet.createRandom();
  const identity = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    did: `did:ethr:0xaa36a7:${wallet.address}`
  };
  fs.writeFileSync(file, JSON.stringify(identity, null, 2));
  return identity;
}

function storeCredential(credentialJwt) {
  fs.writeFileSync("./stored-credential.txt", credentialJwt);
  console.log("Credential stored.");
}

async function createPresentation(credentialJwt) {
  const identity = getOrCreateStudentIdentity();
  const issuer = new EthrDID({
  identifier: identity.address,
  privateKey: identity.privateKey.replace("0x", ""),
  chainNameOrId: "0xaa36a7"
});

  const vpPayload = {
    vp: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiablePresentation"],
      verifiableCredential: [credentialJwt]
    }
  };

  const vpJwt = await createVerifiablePresentationJwt(vpPayload, issuer);
  console.log("Presentation JWT:\n", vpJwt);
  return vpJwt;
}

module.exports = { getOrCreateStudentIdentity, storeCredential, createPresentation };