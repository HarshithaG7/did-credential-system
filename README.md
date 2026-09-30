DID Credential System

A decentralized identity credential system using blockchain-based credential verification and revocation.

Project Structure

- "contracts/" - Solidity smart contracts
- "issuer-service/" - Credential issuer service
- "verifier-service/" - Credential verifier service
- "wallet-app/" - Digital credential wallet
- "docs/" - Architecture diagrams and documentation

Blockchain - Revocation Registry

The "RevocationRegistry.sol" smart contract provides on-chain credential revocation.

Features

- Revoke a credential using its unique credential ID
- Check whether a credential has been revoked
- Emit an event when a credential is revoked

Development Setup

The blockchain component uses:

- Solidity
- Hardhat
- TypeScript
- Ethers.js
- Mocha and Chai

Testing

Run the smart contract tests with:

npx hardhat test

The Revocation Registry test verifies that:

- A credential is initially not revoked.
- The credential can be revoked.
- The revoked status is correctly returned by the contract.

Deployed Contract

Sepolia Testnet

Revocation Registry Contract:

"0x08026e068E1b4B6428c68f173F0D0616c7b84D00"

Network: Sepolia
Contract: RevocationRegistry

---

Issuer Service

The Issuer Service is responsible for creating and digitally signing university credentials.

Features

- Creates a university issuer DID.
- Generates Verifiable Credentials for students.
- Digitally signs credentials using the issuer's private key.
- Uses Ethereum Sepolia for DID resolution.
- Supports credential signature verification.
- Detects tampering with signed credentials.

Credential Information

The Issuer Service accepts the following student information:

- Student DID
- Student Name
- Degree Name
- Field of Study
- University
- Graduation Year

The service generates a signed Verifiable Credential containing these claims.

Issuer Network

Network: Ethereum Sepolia
Chain ID: "11155111"

Issuer DID

did:ethr:0xaa36a7:0xecaf7b3e34b5c8649a67d6db868ae4b58e565b65

Issuer API

The Issuer Service runs on:

http://localhost:3001

Credential issuance endpoint:

POST /issue-credential

Credential Verification Testing

The issuer credential was tested for integrity:

- Original signed credential → Signature verified successfully
- Modified/tampered credential → Verification failed
- Original credential restored → Signature verified successfully

This confirms that changing the credential data without generating a new valid signature is detected during verification.

«Security: Private keys, ".env" files, RPC credentials, and other secrets must not be committed to the repository or shared publicly.»
