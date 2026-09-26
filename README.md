# DID Credential System

A decentralized identity credential system using blockchain-based credential verification and revocation.

## Project Structure

* `contracts/` - Solidity smart contracts
* `issuer-service/` - Credential issuer service
* `verifier-service/` - Credential verifier service
* `wallet-app/` - Digital credential wallet
* `docs/` - Architecture diagrams and documentation

## Blockchain - Revocation Registry

The `RevocationRegistry.sol` smart contract provides on-chain credential revocation.

### Features

* Revoke a credential using its unique credential ID
* Check whether a credential has been revoked
* Emit an event when a credential is revoked

### Development Setup

The blockchain component uses:

* Solidity
* Hardhat
* TypeScript
* Ethers.js
* Mocha and Chai

### Testing

Run the smart contract tests with:

```bash
npx hardhat test
```

The Revocation Registry test verifies that:

1. A credential is initially not revoked.
2. The credential can be revoked.
3. The revoked status is correctly returned by the contract.
