# Verifiable Credential Schema

This document defines the shape of the credential our system issues, verifies, and revokes.
**Member 2 (Issuer)** and **Member 3 (Verifier/Wallet)** must both build against this exact schema — if it needs to change, update this file first and flag it to the team before changing code.

---

## 1. DID Method

We use `did:ethr`, anchored on the **Polygon Amoy testnet**.

Example DID:
```
did:ethr:0x89:0xF3beAC30C498D9E26865F34fCAa57dBB935b0D74
```
(`0x89` = Polygon chain ID in hex; the rest is the address tied to the DID's key pair)

- **University (Issuer) DID** — one fixed DID, generated once, kept stable for the whole project.
- **Student (Holder) DID** — one generated per student wallet instance.

---

## 2. Credential Type

We are issuing a single credential type for this project: **UniversityDegreeCredential**.

Keep it to one type for now — do not add new credential types mid-project without updating this doc.

---

## 3. Verifiable Credential (VC) JSON Structure

This is the payload the Issuer signs and the Verifier checks. Based on the W3C Verifiable Credentials Data Model, expressed as a signed JWT-VC (via Veramo / did-jwt-vc).

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "type": [
    "VerifiableCredential",
    "UniversityDegreeCredential"
  ],
  "issuer": "did:ethr:0x89:<university-did>",
  "issuanceDate": "2026-08-22T00:00:00Z",
  "credentialSubject": {
    "id": "did:ethr:0x89:<student-did>",
    "degree": {
      "name": "Bachelor of Technology",
      "field": "Computer Science",
      "university": "Your College Name",
      "graduationYear": 2026
    },
    "studentName": "Full Name",
    "gpa": 8.7
  },
  "credentialStatus": {
    "id": "https://your-registry-contract-address#<credential-id>",
    "type": "RevocationList2020Status",
    "revocationListIndex": "<index-in-registry>"
  }
}
```

This whole object gets signed by the issuer's private key and encoded as a JWT. That signed JWT string is the actual "credential" the student holds and later presents.

---

## 4. Field Rules

| Field | Required | Notes |
|---|---|---|
| `issuer` | Yes | Must always be the university's fixed DID |
| `issuanceDate` | Yes | ISO 8601 format |
| `credentialSubject.id` | Yes | The student's DID |
| `credentialSubject.degree.*` | Yes | Core academic data |
| `credentialSubject.studentName` | Yes | Plaintext for demo simplicity — no encryption needed |
| `credentialSubject.gpa` | Optional | Used specifically to demo **selective disclosure** (holder may choose to hide this field when presenting) |
| `credentialStatus` | Yes | Links to the on-chain revocation registry entry for this credential |

---

## 5. Selective Disclosure (Simplified)

We are **not** implementing cryptographic selective disclosure (e.g., BBS+ signatures) — that's out of scope, and should be listed as a "Known Limitation / Future Work" item in the report.

Instead, the wallet app will support **field-level reveal/hide** at the application layer:
- The holder can choose to share the full VC, or a version with certain fields (e.g. `gpa`) stripped out before sending to the verifier.
- This is **not cryptographically enforced** — it's a UX-level filter. Be upfront about this distinction in the report; don't imply it's zero-knowledge.

Example use case to demo: student proves "has a valid CS degree from University X" to an employer, without revealing GPA.

---

## 6. Revocation Registry (On-chain)

Handled by Member 1's smart contract. Each issued credential gets a unique `credentialId` (a `bytes32` hash, e.g. `keccak256` of the VC's JWT or a UUID assigned at issuance).

Minimal contract interface both Issuer and Verifier code should expect:

```solidity
function revoke(bytes32 credentialId) external onlyIssuer;
function isRevoked(bytes32 credentialId) external view returns (bool);
```

- Issuer service calls `revoke()` if a credential needs to be invalidated.
- Verifier service calls `isRevoked()` as part of every verification check — a valid signature is not enough, it must also pass this check.

---

## 7. Verification Checklist (what Member 3's verifier must check, in order)

1. **Signature valid** — JWT signature matches the issuer's DID public key.
2. **Issuer trusted** — `issuer` field matches our known university DID (hardcoded for this project's scope — no dynamic trust registry).
3. **Not expired** — if we add `expirationDate` later, check it (optional for MVP).
4. **Not revoked** — call `isRevoked(credentialId)` on-chain, must return `false`.

Only if all four pass does the verifier show "✅ Valid Credential" to the employer.

---

## 8. Change Process

If this schema needs to change:
1. Open a GitHub Issue describing the change and why.
2. Get agreement from all 3 members (quick message is fine).
3. Update this file in a PR — don't just change it silently.
4. Only then update issuer/verifier code to match.

This file is the single source of truth for the credential format — code should match this doc, not the other way around.
