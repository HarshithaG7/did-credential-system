
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Wallet } from "ethers";
import dotenv from "dotenv";

const dir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(dir, "../.env");

const oldEnv = fs.existsSync(envPath)
  ? dotenv.parse(fs.readFileSync(envPath))
  : {};

const wallet = Wallet.createRandom();
const chainId = "0x13882";

const issuerDID =
  `did:ethr:${chainId}:${wallet.address.toLowerCase()}`;

const envContent = [
  `ISSUER_DID=${issuerDID}`,
  `ISSUER_PRIVATE_KEY=${wallet.privateKey}`,
  `POLYGON_AMOY_CHAIN_ID=80002`,
  `REGISTRY_ADDRESS=${oldEnv.REGISTRY_ADDRESS || ""}`,
  `RPC_URL=${oldEnv.RPC_URL || "https://rpc-amoy.polygon.technology/"}`,
  `PORT=${oldEnv.PORT || "3001"}`
].join("\n") + "\n";

fs.writeFileSync(envPath, envContent, {
  flag: "w",
  mode: 0o600
});

console.log("New issuer wallet generated.");
console.log("New issuer DID:", issuerDID);
console.log("New private key saved locally in .env.");
console.log("Do not share the private key.");