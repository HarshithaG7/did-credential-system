
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import {
  Wallet,
  keccak256,
  toUtf8Bytes,
  getBytes
} from "ethers";
import { ES256KSigner } from "did-jwt";
import { createVerifiableCredentialJwt } from "did-jwt-vc";

dotenv.config();

const issuerDID = process.env.ISSUER_DID;
const privateKey = process.env.ISSUER_PRIVATE_KEY;

if (!issuerDID || !privateKey) {
  throw new Error("Issuer DID or private key is missing from .env");
}

const wallet = new Wallet(privateKey);

if (wallet.address.toLowerCase() !== issuerDID.split(":").pop().toLowerCase()) {
  throw new Error("Issuer DID does not match the private key");
}

const signer = ES256KSigner(getBytes(privateKey), true);

const issuer = {
  did: issuerDID,
  signer,
  alg: "ES256K-R"
};

export async function issueCredential(student) {
  if (!student.studentDID || !student.studentName) {
    throw new Error("Student DID and name are required");
  }

  const credentialId = keccak256(toUtf8Bytes(randomUUID()));

  const credentialPayload = {
    sub: student.studentDID,
    nbf: Math.floor(Date.now() / 1000),
    vc: {
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      type: [
        "VerifiableCredential",
        "UniversityDegreeCredential"
      ],
      issuer: issuerDID,
      issuanceDate: new Date().toISOString(),
      id: credentialId,
      credentialSubject: {
        id: student.studentDID,
        studentName: student.studentName,
        degree: {
          name: student.degreeName || "Bachelor of Technology",
          field: student.field || "Computer Science",
          university: student.university || "Your University",
          graduationYear: student.graduationYear || 2026
        }
      }
    }
  };

  const signedCredential = await createVerifiableCredentialJwt(
    credentialPayload,
    issuer
  );

  return {
    credentialId,
    signedCredential
  };
}