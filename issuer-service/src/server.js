
import express from "express";
import dotenv from "dotenv";
import { issueCredential } from "./credential.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    project: "University Issuer Service",
    status: "running",
    issuerDID: process.env.ISSUER_DID
  });
});

// Issue a university credential
app.post("/issue-credential", async (req, res) => {
  try {
    const {
      studentDID,
      studentName,
      degreeName,
      field,
      university,
      graduationYear
    } = req.body;

    if (!studentDID || !studentName) {
      return res.status(400).json({
        error: "Student DID and student name are required"
      });
    }

    const result = await issueCredential({
      studentDID,
      studentName,
      degreeName,
      field,
      university,
      graduationYear
    });

    res.status(201).json({
      message: "Credential issued successfully",
      credentialId: result.credentialId,
      signedCredential: result.signedCredential
    });
  } catch (error) {
    console.error("Credential issuance failed:", error.message);

    res.status(500).json({
      error: "Credential issuance failed"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Issuer service running at http://localhost:${PORT}`);
  console.log("Issuer DID:", process.env.ISSUER_DID);
});