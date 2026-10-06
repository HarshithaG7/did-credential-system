import { useState, useEffect } from "react"
import { ethers } from "ethers"
import "./App.css"

const CONTRACT_ADDRESS =
  "0xB331F6C9a2eb3BA124a0eee56Db64BdAef2318Ac"

const CONTRACT_ABI = [
  "function issueCredential(bytes32 credentialId) public",
  "function isIssued(bytes32 credentialId) public view returns (bool)",
  "function revokeCredential(bytes32 credentialId) public",
  "function isRevoked(bytes32 credentialId) public view returns (bool)"
]

function App() {
  const [account, setAccount] = useState("")
  const [mode, setMode] = useState("issuer")

  const [studentName, setStudentName] = useState("")
  const [holderDID, setHolderDID] = useState("")
  const [university, setUniversity] = useState("")
  const [degree, setDegree] = useState("")
  const [credentialType, setCredentialType] = useState(
    "Academic Certificate"
  )
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  const [credentialId, setCredentialId] = useState("")

  const [issuedCredentials, setIssuedCredentials] =
    useState(() => {
      const savedCredentials =
        localStorage.getItem("issuedCredentials")

      return savedCredentials
        ? JSON.parse(savedCredentials)
        : []
    })

  const [status, setStatus] = useState("")
  const [verificationResult, setVerificationResult] =
    useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem(
      "issuedCredentials",
      JSON.stringify(issuedCredentials)
    )
  }, [issuedCredentials])

  async function connectWallet() {
    if (!window.ethereum) {
      setStatus("Please install MetaMask.")
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      })

      setAccount(accounts[0])
      setStatus("Wallet connected successfully.")
    } catch {
      setStatus("Wallet connection was cancelled.")
    }
  }

  function generateCredentialId() {
    return "cred-" + crypto.randomUUID()
  }

  function getCredentialHash(id = credentialId) {
    if (!id.trim()) {
      throw new Error("Please enter a credential ID.")
    }

    return ethers.keccak256(
      ethers.toUtf8Bytes(id.trim())
    )
  }

  async function issueCredential(event) {
    event.preventDefault()

    if (!studentName.trim()) {
      setStatus("Please enter the student's name.")
      return
    }

    if (!holderDID.trim()) {
      setStatus("Please enter the holder DID.")
      return
    }

    if (!university.trim()) {
      setStatus("Please enter the university name.")
      return
    }

    if (!degree.trim()) {
      setStatus("Please enter the degree or course.")
      return
    }

    if (!issueDate) {
      setStatus("Please select the issue date.")
      return
    }

    if (!window.ethereum) {
      setStatus("Please install MetaMask.")
      return
    }

    try {
      setLoading(true)
      setVerificationResult(null)

      const provider = new ethers.BrowserProvider(
        window.ethereum
      )

      const network = await provider.getNetwork()

      if (network.chainId !== 11155111n) {
        setStatus("Please switch MetaMask to Sepolia.")
        return
      }

      const signer = await provider.getSigner()

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      )

      const id = generateCredentialId()
      const hash = getCredentialHash(id)

      setStatus(
        "Submitting credential issuance transaction..."
      )

      const transaction =
        await contract.issueCredential(hash)

      setStatus(
        "Credential issuance submitted. Waiting for confirmation..."
      )

      await transaction.wait()

      const credential = {
        id,
        studentName: studentName.trim(),
        holderDID: holderDID.trim(),
        university: university.trim(),
        degree: degree.trim(),
        type: credentialType,
        issuer: account,
        issuedAt: new Date().toISOString(),
        issueDate,
        status: "Issued",
        issueTxHash: transaction.hash
      }

      setIssuedCredentials(previous => [
        credential,
        ...previous
      ])

      setCredentialId(id)

      setStudentName("")
      setHolderDID("")
      setUniversity("")
      setDegree("")

      setStatus(
        "Credential successfully issued and registered on-chain."
      )
    } catch (error) {
      console.error(error)

      if (
        error.message.includes(
          "Credential already issued"
        )
      ) {
        setStatus(
          "This credential has already been issued."
        )
      } else {
        setStatus(
          error.reason ||
            error.shortMessage ||
            "Credential issuance failed or was cancelled."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  async function verifyCredential() {
    if (!window.ethereum) {
      setStatus("Please install MetaMask.")
      return
    }

    try {
      setLoading(true)
      setVerificationResult(null)

      const provider = new ethers.BrowserProvider(
        window.ethereum
      )

      const network = await provider.getNetwork()

      if (network.chainId !== 11155111n) {
        setStatus("Please switch MetaMask to Sepolia.")
        return
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      )

      const hash = getCredentialHash()

      const issued = await contract.isIssued(hash)

      if (!issued) {
        setStatus(
          "❌ This credential was not issued by the registered credential system."
        )
        return
      }

      const revoked = await contract.isRevoked(hash)

      const credential = issuedCredentials.find(
        item => item.id === credentialId.trim()
      )

      if (!credential) {
        setStatus(
          "Credential is registered on-chain, but its certificate details are not available in this session."
        )
        return
      }

      if (revoked) {
        setVerificationResult({
          valid: false,
          revoked: true,
          credential
        })

        setStatus(
          "❌ This credential was issued but has been revoked."
        )
      } else {
        setVerificationResult({
          valid: true,
          revoked: false,
          credential
        })

        setStatus(
          "✅ Credential is valid: issued on-chain and not revoked."
        )
      }
    } catch (error) {
      console.error(error)

      setStatus(
        error.message.includes("Please enter")
          ? error.message
          : "Unable to verify the credential."
      )
    } finally {
      setLoading(false)
    }
  }

  async function revokeCredential() {
    if (!window.ethereum) {
      setStatus("Please install MetaMask.")
      return
    }

    try {
      setLoading(true)
      setVerificationResult(null)

      const provider = new ethers.BrowserProvider(
        window.ethereum
      )

      const network = await provider.getNetwork()

      if (network.chainId !== 11155111n) {
        setStatus("Please switch MetaMask to Sepolia.")
        return
      }

      const signer = await provider.getSigner()

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      )

      const hash = getCredentialHash()

      const issued = await contract.isIssued(hash)

      if (!issued) {
        setStatus(
          "This credential has not been issued on-chain, so it cannot be revoked."
        )
        return
      }

      const revoked = await contract.isRevoked(hash)

      if (revoked) {
        setStatus("This credential is already revoked.")
        return
      }

      const transaction =
        await contract.revokeCredential(hash)

      setStatus(
        "Revocation transaction submitted. Waiting for confirmation..."
      )

      await transaction.wait()

      setIssuedCredentials(previous =>
        previous.map(credential =>
          credential.id === credentialId.trim()
            ? {
                ...credential,
                status: "Revoked",
                revokeTxHash: transaction.hash
              }
            : credential
        )
      )

      setStatus(
        "❌ Credential successfully revoked on-chain."
      )
    } catch (error) {
      console.error(error)

      setStatus(
        error.reason ||
          error.shortMessage ||
          "Revocation transaction failed or was cancelled."
      )
    } finally {
      setLoading(false)
    }
  }

  function switchMode(selectedMode) {
    setMode(selectedMode)
    setStatus("")
    setVerificationResult(null)
    setCredentialId("")
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">◆</span>
          DID System
        </div>

        <div className="nav-links">
          <a href="#dashboard">Dashboard</a>

          {mode === "issuer" && (
            <a href="#issue">Issue</a>
          )}

          <a href="#credentials">Verify</a>
        </div>

        <button
          className="connect-btn"
          onClick={connectWallet}
        >
          {account
            ? `${account.slice(0, 6)}...${account.slice(-4)}`
            : "Connect Wallet"}
        </button>
      </nav>

      <main className="main">
        <section
          className="hero"
          id="dashboard"
        >
          <div className="hero-text">
            <div className="badge">
              🔐 Decentralized Identity
            </div>

            <h1>
              DID Credential
              <span>Management System</span>
            </h1>

            <p>
              Issue digital credentials, register them
              on-chain, and verify their authenticity
              and revocation status.
            </p>

            <div className="hero-buttons">
              {mode === "issuer" && (
                <button
                  className="primary-btn"
                  onClick={() =>
                    document
                      .getElementById("issue")
                      .scrollIntoView({
                        behavior: "smooth"
                      })
                  }
                >
                  Issue Credential
                </button>
              )}

              <button
                className="secondary-btn"
                onClick={() =>
                  document
                    .getElementById("credentials")
                    .scrollIntoView({
                      behavior: "smooth"
                    })
                }
              >
                Verify Credential
              </button>
            </div>
          </div>

          <div className="identity-card">
            <div className="card-header">
              <span>Credential Registry</span>

              <span className="verified">
                ● Sepolia
              </span>
            </div>

            <div className="profile">
              <div className="avatar">DID</div>

              <div>
                <h3>
                  {mode === "issuer"
                    ? "Issuer Mode"
                    : "Verifier Mode"}
                </h3>

                <p>
                  {account
                    ? `${account.slice(
                        0,
                        10
                      )}...${account.slice(-8)}`
                    : "Connect your wallet"}
                </p>
              </div>
            </div>

            <div className="hash">
              <span>Contract Address</span>

              <p className="address-text">
                {CONTRACT_ADDRESS}
              </p>
            </div>

            <div className="card-details">
              <div>
                <span>
                  Created This Session
                </span>

                <strong>
                  {issuedCredentials.length}
                </strong>
              </div>

              <div>
                <span>Current Mode</span>

                <strong className="active">
                  {mode === "issuer"
                    ? "Issuer"
                    : "Verifier"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="section-heading">
            <span>
              SELECT WORKFLOW
            </span>

            <h2>Choose Your Role</h2>

            <p>
              Select whether you are issuing
              credentials or verifying them.
            </p>
          </div>

          <div className="registry-panel">
            <div className="hero-buttons registry-buttons">
              <button
                type="button"
                className={
                  mode === "issuer"
                    ? "primary-btn"
                    : "secondary-btn"
                }
                onClick={() =>
                  switchMode("issuer")
                }
              >
                🏫 Issuer Mode
              </button>

              <button
                type="button"
                className={
                  mode === "verifier"
                    ? "primary-btn"
                    : "secondary-btn"
                }
                onClick={() =>
                  switchMode("verifier")
                }
              >
                🔍 Verifier Mode
              </button>
            </div>
          </div>
        </section>

        {mode === "issuer" && (
          <section
            className="features"
            id="issue"
          >
            <div className="section-heading">
              <span>
                ISSUER WORKFLOW
              </span>

              <h2>Issue New Credential</h2>

              <p>
                Create a university credential
                and register it on the Sepolia
                blockchain.
              </p>
            </div>

            <form
              className="issue-form"
              onSubmit={issueCredential}
            >
              <label htmlFor="studentName">
                Student Name
              </label>

              <input
                id="studentName"
                className="credential-input"
                placeholder="Enter student's full name"
                value={studentName}
                onChange={event =>
                  setStudentName(
                    event.target.value
                  )
                }
                required
              />

              <label htmlFor="holderDID">
                Holder DID
              </label>

              <input
                id="holderDID"
                className="credential-input"
                placeholder="did:example:123456"
                value={holderDID}
                onChange={event =>
                  setHolderDID(
                    event.target.value
                  )
                }
                required
              />

              <label htmlFor="university">
                University / Institution
              </label>

              <input
                id="university"
                className="credential-input"
                placeholder="Enter university or institution"
                value={university}
                onChange={event =>
                  setUniversity(
                    event.target.value
                  )
                }
                required
              />

              <label htmlFor="degree">
                Degree / Course
              </label>

              <input
                id="degree"
                className="credential-input"
                placeholder="B.E. Computer Science and Engineering"
                value={degree}
                onChange={event =>
                  setDegree(
                    event.target.value
                  )
                }
                required
              />

              <label htmlFor="credentialType">
                Credential Type
              </label>

              <select
                id="credentialType"
                className="credential-input"
                value={credentialType}
                onChange={event =>
                  setCredentialType(
                    event.target.value
                  )
                }
              >
                <option>
                  Academic Certificate
                </option>

                <option>
                  Identity Credential
                </option>

                <option>
                  Employment Certificate
                </option>

                <option>
                  Course Completion
                </option>
              </select>

              <label htmlFor="issueDate">
                Issue Date
              </label>

              <input
                id="issueDate"
                type="date"
                className="credential-input"
                value={issueDate}
                onChange={event =>
                  setIssueDate(
                    event.target.value
                  )
                }
                required
              />

              <button
                className="primary-btn"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Processing..."
                  : "Issue Credential On-Chain"}
              </button>

              <p className="form-note">
                Issuing a credential requires
                a MetaMask transaction on Sepolia.
              </p>
            </form>
          </section>
        )}

        <section
          className="features"
          id="credentials"
        >
          <div className="section-heading">
            <span>
              {mode === "issuer"
                ? "ISSUER & VERIFIER WORKFLOW"
                : "VERIFIER WORKFLOW"}
            </span>

            <h2>
              {mode === "issuer"
                ? "Verify or Revoke"
                : "Verify Credential"}
            </h2>

            <p>
              {mode === "issuer"
                ? "Verify a credential or revoke an issued credential."
                : "Check whether a credential was issued and whether it has been revoked."}
            </p>
          </div>

          <div className="registry-panel">
            <label htmlFor="credentialId">
              Credential ID
            </label>

            <input
              id="credentialId"
              className="credential-input"
              placeholder="Enter a credential ID"
              value={credentialId}
              onChange={event =>
                setCredentialId(
                  event.target.value
                )
              }
            />

            <div className="hero-buttons registry-buttons">
              <button
                type="button"
                className="secondary-btn"
                onClick={verifyCredential}
                disabled={loading}
              >
                Verify Credential
              </button>

              {mode === "issuer" && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={revokeCredential}
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : "Revoke Credential"}
                </button>
              )}
            </div>
          </div>

          {status && (
            <div
              className="status-box"
              role="status"
            >
              {status}
            </div>
          )}

          {verificationResult &&
            verificationResult.credential && (
              <div className="verification-card">
                <div className="verification-header">
                  <h3>
                    Credential Verification
                  </h3>

                  <span
                    className={
                      verificationResult.revoked
                        ? "revoked-label"
                        : "issued-label"
                    }
                  >
                    {verificationResult.revoked
                      ? "REVOKED"
                      : "VALID"}
                  </span>
                </div>

                <div className="verification-details">
                  <div>
                    <span>
                      Student Name
                    </span>

                    <strong>
                      {
                        verificationResult
                          .credential.studentName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Credential ID
                    </span>

                    <strong>
                      {
                        verificationResult
                          .credential.id
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Holder DID
                    </span>

                    <strong>
                      {
                        verificationResult
                          .credential.holderDID
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      University / Institution
                    </span>

                    <strong>
                      {
                        verificationResult
                          .credential.university
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Degree / Course
                    </span>

                    <strong>
                      {
                        verificationResult
                          .credential.degree
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Credential Type
                    </span>

                    <strong>
                      {
                        verificationResult
                          .credential.type
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Issue Date
                    </span>

                    <strong>
                      {
                        verificationResult
                          .credential.issueDate
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Issuer
                    </span>

                    <strong>
                      {
                        verificationResult
                          .credential.issuer
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Blockchain
                    </span>

                    <strong>
                      Ethereum Sepolia
                    </strong>
                  </div>

                  <div>
                    <span>
                      Issued On-Chain
                    </span>

                    <strong>
                      ✅ Yes
                    </strong>
                  </div>

                  <div>
                    <span>
                      Revoked
                    </span>

                    <strong>
                      {verificationResult.revoked
                        ? "❌ Yes"
                        : "No"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Issue Transaction
                    </span>

                    <strong>
                      {verificationResult.credential
                        .issueTxHash ? (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${verificationResult.credential.issueTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View on Etherscan →
                        </a>
                      ) : (
                        "Not available"
                      )}
                    </strong>
                  </div>

                  {verificationResult.credential
                    .revokeTxHash && (
                    <div>
                      <span>
                        Revocation Transaction
                      </span>

                      <strong>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${verificationResult.credential.revokeTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View on Etherscan →
                        </a>
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>
                      Credential Created
                    </span>

                    <strong>
                      {new Date(
                        verificationResult
                          .credential.issuedAt
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            )}

          {mode === "issuer" && (
            <div className="issued-list">
              <h3>
                Credentials Created This Session
              </h3>

              {issuedCredentials.length === 0 ? (
                <p className="empty-state">
                  No credentials created yet.
                  Use the issuance form above.
                </p>
              ) : (
                issuedCredentials.map(
                  credential => (
                    <div
                      className="issued-item"
                      key={credential.id}
                    >
                      <div>
                        <strong>
                          {credential.studentName}
                        </strong>

                        <p>
                          {credential.degree}
                        </p>

                        <p>
                          {credential.university}
                        </p>

                        <p>
                          {credential.id}
                        </p>

                        <p>
                          Status:{" "}
                          {credential.status}
                        </p>
                      </div>

                      <div className="issued-actions">
                        <span
                          className={
                            credential.status ===
                            "Revoked"
                              ? "revoked-label"
                              : "issued-label"
                          }
                        >
                          {credential.status}
                        </span>

                        <button
                          className="card-btn"
                          onClick={() => {
                            setCredentialId(
                              credential.id
                            )

                            document
                              .getElementById(
                                "credentials"
                              )
                              .scrollIntoView({
                                behavior: "smooth"
                              })
                          }}
                        >
                          Use ID →
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          )}
        </section>

        <section className="stats">
          <div>
            <strong>
              {issuedCredentials.length}
            </strong>

            <span>
              Session Credentials
            </span>
          </div>

          <div>
            <strong>
              Sepolia
            </strong>

            <span>
              Test Network
            </span>
          </div>

          <div>
            <strong>
              On-chain
            </strong>

            <span>
              Credential Registry
            </span>
          </div>

          <div>
            <strong>
              {mode === "issuer"
                ? "Issuer"
                : "Verifier"}
            </strong>

            <span>
              Current Mode
            </span>
          </div>
        </section>
      </main>

      <footer id="about">
        <div>
          <strong>
            ◆ DID Credential System
          </strong>

          <p>
            A decentralized platform for
            managing digital credentials.
          </p>
        </div>

        <span>
          React • Ethers.js • Ethereum Sepolia
        </span>
      </footer>
    </div>
  )
}

export default App