const { ethers } = require("ethers");

// TODO: replace with your own free Sepolia RPC URL (Alchemy/Infura)
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/alch_Eg86RJTWayifbl7Btvi7X";
const CONTRACT_ADDRESS = "0x08026e068E1b4B6428c68f173F0D0616c7b84D00"; // from README

// Minimal ABI built from README's described functions.
// TODO: swap with Member 1's real ABI once you get it (function names might differ slightly).
const ABI = [
  "function isRevoked(bytes32 credentialId) view returns (bool)",
  "function revoke(bytes32 credentialId)",
  "event CredentialRevoked(bytes32 indexed credentialId)"
];

async function checkRevocation(credentialId) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const idHash = credentialId; // already a bytes32 hex value from the issuer
    const revoked = await contract.isRevoked(idHash);
    return revoked;
  } catch (err) {
    console.error("Revocation check failed:", err.message);
    return false;
  }
}

module.exports = { checkRevocation };