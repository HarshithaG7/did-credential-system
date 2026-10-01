const express = require("express");
const { verifyCredential, verifyPresentation } = require("did-jwt-vc");
const { Resolver } = require("did-resolver");
const { getResolver } = require("ethr-did-resolver");
const { checkRevocation } = require("./revocation");

const app = express();
app.use(express.json());

// TODO: same RPC URL as revocation.js
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/alch_Eg86RJTWayifbl7Btvi7X";

const ethrResolver = getResolver({
  networks: [{
    name: "0xaa36a7",
    chainId: 11155111,
    rpcUrl: RPC_URL,
    registry: "0x03d5003bf0e79C5F5223588F347ebA39AfbC3818"
  }]
});
const resolver = new Resolver(ethrResolver);

app.post("/verify", async (req, res) => {
  const { presentationJwt } = req.body; // the VP the wallet sends
  if (!presentationJwt) {
    return res.status(400).json({ valid: false, reason: "missing_presentation" });
  }

  try {
    // 1. Verify the presentation (student's signature)
    const vpResult = await verifyPresentation(presentationJwt, resolver);
    const vc = vpResult.payload.vp.verifiableCredential[0];

    // 2. Verify the credential itself (issuer's signature)
    const vcResult = await verifyCredential(vc, resolver);
    const credentialSubject = vcResult.verifiableCredential.credentialSubject;
    const credentialId = vcResult.verifiableCredential.id || vc; // fallback if no explicit id

    // 3. Confirm holder matches subject
    const holderDid = vpResult.issuer; // DID that signed the VP
    if (credentialSubject.id !== holderDid) {
      return res.json({ valid: false, reason: "holder_mismatch" });
    }

    // 4. Check revocation
    const revoked = await checkRevocation(credentialId);
    if (revoked) {
      return res.json({ valid: false, reason: "revoked" });
    }

    return res.json({ valid: true, credentialSubject });
  } catch (err) {
    console.error(err);
    return res.json({ valid: false, reason: "invalid_signature" });
  }
});

app.listen(3002, () => console.log("Verifier service running on http://localhost:3002"));