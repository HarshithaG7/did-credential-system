# DID Credential System

A decentralized identity credential system that uses **blockchain technology, Verifiable Credentials, and cryptographic signatures** to issue, verify, and revoke digital credentials.

The system is designed around a university-to-student-to-employer workflow:

```text
University
    │
    │ Issue Credential
    ▼
 Student Wallet
    │
    │ Present Credential
    ▼
  Employer
    │
    │ Verify Credential
    ▼
Blockchain + Signature Verification
    │
    ├── Valid
    └── Revoked / Invalid
```

---

## Project Structure

```text
did-credential-system/
│
├── contracts/           # Solidity smart contracts
├── issuer-service/      # University credential issuer service
├── verifier-service/    # Credential verification service
├── wallet-app/          # Digital credential wallet
├── frontend/            # React frontend
├── docs/                # Architecture diagrams and documentation
└── README.md
```

---

# Blockchain - Revocation Registry

The `RevocationRegistry.sol` smart contract provides an on-chain registry for credential issuance and revocation.

## Features

* Register a credential as issued on-chain
* Revoke an issued credential
* Check whether a credential was issued
* Check whether a credential has been revoked
* Emit events when credentials are issued or revoked
* Prevent revoking credentials that were never issued
* Prevent duplicate issuance or revocation

## Smart Contract Functions

| Function             | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `issueCredential()`  | Records a credential as issued               |
| `isIssued()`         | Checks whether a credential was issued       |
| `revokeCredential()` | Revokes an issued credential                 |
| `isRevoked()`        | Checks whether a credential has been revoked |

---

## Development Setup

The blockchain component uses:

* Solidity
* Hardhat
* TypeScript
* Ethers.js
* Mocha
* Chai

### Run Smart Contract Tests

```bash
npx hardhat test
```

The tests verify that:

* A credential is initially not revoked.
* A credential can be issued.
* An issued credential can be revoked.
* The issued status is correctly returned.
* The revoked status is correctly returned.

---

# Deployed Smart Contract

### Sepolia Testnet

**Network:** Ethereum Sepolia
**Chain ID:** `11155111`

**Contract:** `RevocationRegistry`

**Contract Address:**

```text
0xB331F6C9a2eb3BA124a0eee56Db64BdAef2318Ac
```

---

# Issuer Service

The Issuer Service is responsible for creating and digitally signing university credentials.

The university acts as the credential issuer and creates a **Verifiable Credential** containing information about a student.

## Features

* Creates a university issuer DID
* Generates Verifiable Credentials for students
* Digitally signs credentials using the issuer's private key
* Uses Ethereum Sepolia for DID resolution
* Supports credential signature verification
* Detects tampering with signed credentials
* Integrates with the blockchain credential registry

---

## Credential Information

The Issuer Service accepts the following student information:

* Student DID
* Student Name
* Degree Name
* Field of Study
* University
* Graduation Year

The service generates a digitally signed Verifiable Credential containing these claims.

Example credential information:

```text
Student DID
Student Name
Degree Name
Field of Study
University
Graduation Year
```

---

# Issuer Network

**Network:** Ethereum Sepolia
**Chain ID:** `11155111`

## Issuer DID

```text
did:ethr:0xaa36a7:0xecaf7b3e34b5c8649a67d6db868ae4b58e565b65
```

---

# Issuer API

The Issuer Service runs locally at:

```text
http://localhost:3001
```

### Credential Issuance Endpoint

```text
POST /issue-credential
```

The endpoint creates and digitally signs a Verifiable Credential using the university issuer's credentials.

---

# Credential Verification

The credential system performs two major verification checks:

### 1. Cryptographic Verification

The issuer's digital signature is checked to ensure that:

* The credential was signed by the expected issuer.
* The credential has not been modified after signing.

### 2. Blockchain Verification

The credential's status is checked against the on-chain Revocation Registry:

```text
Credential
     │
     ├── Signature Valid?
     │       │
     │       └── Yes
     │
     └── Blockchain Status
             │
             ├── Issued + Not Revoked → VALID
             │
             ├── Issued + Revoked → REVOKED
             │
             └── Not Issued → INVALID
```

---

# Credential Verification Testing

The issuer credential was tested for integrity.

### Original Credential

```text
Original signed credential
        ↓
Signature verification
        ↓
Successfully verified
```

### Tampered Credential

```text
Modified credential data
        ↓
Signature verification
        ↓
Verification failed
```

### Restored Credential

```text
Original credential restored
        ↓
Signature verification
        ↓
Successfully verified
```

This confirms that modifying credential data without generating a new valid signature is detected during verification.

---

# Credential Lifecycle

The intended credential lifecycle is:

```text
┌──────────────┐
│  University  │
└──────┬───────┘
       │
       │ 1. Issue Credential
       ▼
┌──────────────┐
│    Student   │
└──────┬───────┘
       │
       │ 2. Present Credential
       ▼
┌──────────────┐
│   Employer   │
└──────┬───────┘
       │
       │ 3. Verify
       ▼
┌────────────────────────┐
│ Signature Verification │
│          +             │
│ Blockchain Verification│
└───────────┬────────────┘
            │
       ┌────┴─────┐
       │          │
       ▼          ▼
     VALID      INVALID /
                REVOKED
```

A credential is **not revoked before verification**.

Revocation is only performed by the issuer when an already-issued credential needs to be invalidated.

---

# Security

> **Important:** Private keys, `.env` files, RPC credentials, API keys, and other secrets must never be committed to the repository or shared publicly.

Use environment variables for sensitive configuration.

Example:

```text
.env
```

Make sure sensitive files are included in `.gitignore`.

---

# Project Goal

The goal of this project is to provide a decentralized credential system where universities can issue digitally signed credentials, students can hold and present them, and employers can independently verify their authenticity and current status without relying entirely on a centralized database.
