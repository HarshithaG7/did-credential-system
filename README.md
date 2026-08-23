# DID Credential System

A decentralized identity (DID) system for issuing, holding, and verifying university degree credentials — with blockchain-based revocation, so anyone can verify a credential's authenticity without ever contacting the university directly.

## The Problem

Today, verifying someone's degree usually means contacting the university directly, waiting for a response, and trusting their database hasn't been tampered with. It's slow, and it puts the university in the loop for every single check.

## The Solution

This project lets a university issue **cryptographically signed digital credentials** to students. Employers (or anyone) can instantly verify a credential's authenticity and check whether it's been revoked — using cryptography and a blockchain record, with no need to ever call or email the university.

## How It Works (End to End)

1. **Student generates their own DID** — a self-owned digital identity, created locally in their wallet app. No central authority assigns it.
2. **University (issuer) signs a credential** onto that DID — e.g., "this DID holds a B.Tech in Computer Science, graduated 2026" — cryptographically signed with the university's private key.
3. **Student stores the credential** in their wallet app and controls who they share it with — including hiding specific fields (like GPA) if they choose.
4. **Employer (verifier) receives the credential** and checks:
   - Is the signature genuinely from the university? *(cryptographic check)*
   - Has this credential been revoked? *(checked against an on-chain revocation registry)*
5. If both checks pass, the employer knows instantly and independently that the credential is valid — no phone calls, no waiting, no trusting a database that could be silently edited.

## Why Blockchain?

The blockchain isn't used to store personal data — it only stores a small, tamper-proof **revocation registry**: a public, permanent record of which credential IDs have been cancelled. This is the one piece that genuinely benefits from decentralization — it can't be quietly altered by any single party, including the university itself, once written.

## Architecture

```
Student Wallet  ──stores──▶  Signed Credential (VC)
      │
      ▼
  Employer Verifier ──checks──▶  1. Signature (off-chain, cryptographic)
                                 2. Revocation status (on-chain, blockchain)
```

## Project Structure

| Folder | Purpose |
|---|---|
| `contracts/` | Solidity smart contract for the on-chain revocation registry |
| `issuer-service/` | University-side service: creates the issuer DID, signs credentials |
| `verifier-service/` | Employer-side service: verifies signatures + checks revocation |
| `wallet-app/` | Student-facing app: stores credentials, controls selective disclosure |
| `docs/` | Architecture notes and the [credential schema](docs/VC-SCHEMA.md) |

## Tech Stack

- **Blockchain:** Polygon Amoy testnet (Ethereum-compatible, low-cost)
- **Smart contracts:** Solidity + Hardhat + OpenZeppelin
- **DID method:** `did:ethr`
- **Verifiable Credentials:** Veramo (W3C VC Data Model, JWT-based)
- **Chain client:** ethers.js
- **Backend:** Node.js + Express
- **Frontend:** React

## Team

| Member | Responsibility |
|---|---|
| Member 1 | GitHub/infra, revocation registry smart contract, integration |
| Member 2 | Issuer service (DID creation, credential signing) |
| Member 3 | Verifier service + wallet app (verification, selective disclosure) |

## Getting Started

1. Clone the repo and read `docs/VC-SCHEMA.md` first — it defines the exact credential format all services build against.
2. Check the **Issues** tab for tasks assigned to you under your milestone.
3. Work in a feature branch and open a pull request into `main` — direct pushes to `main` are disabled.

## Known Limitations

- Single issuer (the university) — not a federated multi-issuer trust network.
- Selective disclosure is a simple field-level reveal/hide at the app layer, not cryptographic (e.g., no BBS+ signatures).
- Private key recovery is not solved — an open problem in real-world DID systems too.
