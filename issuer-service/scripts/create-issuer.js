
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

// Ethereum Sepolia
const chainId = "0xaa36a7";

const issuerDID =
  `did:ethr:${chainId}:${wallet.address.toLowerCase()}`;

const envContent = [
  `ISSUER_DID=${issuerDID}`,
  `ISSUER_PRIVATE_KEY=${wallet.privateKey}`,
  `SEPOLIA_CHAIN_ID=11155111`,
  `REGISTRY_ADDRESS=${oldEnv.REGISTRY_ADDRESS || ""}`,
  `RPC_URL=${oldEnv.RPC_URL || ""}`,
  `PORT=${oldEnv.PORT || "3001"}`
].join("\n") + "\n";

fs.writeFileSync(envPath, envContent, {
  flag: "w",
  mode: 0o600
});

console.log("New Sepolia issuer wallet generated.");
console.log("New issuer DID:", issuerDID);
console.log("Private key saved locally in .env.");
console.log("Do not share the private key.");