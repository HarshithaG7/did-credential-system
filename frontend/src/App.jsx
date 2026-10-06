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
  const [holderDID, setHolderDID] = useState("")
  const [credentialType, setCredentialType] = useState(
    "Academic Certificate"
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

    if (!holderDID.trim()) {
      setStatus("Please enter the holder DID.")
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
        holderDID: holderDID.trim(),
        type: credentialType,
        issuer: account,
        issuedAt: new Date().toISOString(),
        status: "Issued",
        issueTxHash: transaction.hash
      }

      setIssuedCredentials(previous => [
        credential,
        ...previous
      ])

      setCredentialId(id)
      setHolderDID("")

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

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">◆</span>
          DID System
        </div>

        <div className="nav-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#issue">Issue</a>
          <a href="#credentials">Credentials</a>
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
                Verify or Revoke
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
                  Decentralized Identity
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
                <span>Wallet</span>

                <strong
                  className={
                    account ? "active" : ""
                  }
                >
                  {account
                    ? "Connected"
                    : "Not connected"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section
          className="features"
          id="issue"
        >
          <div className="section-heading">
            <span>
              CREATE A CREDENTIAL
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

        <section
          className="features"
          id="credentials"
        >
          <div className="section-heading">
            <span>
              REGISTRY OPERATIONS
            </span>

            <h2>Verify or Revoke</h2>

            <p>
              Verify whether a credential
              was issued and whether it has
              been revoked.
            </p>
          </div>

          <div className="registry-panel">
            <label htmlFor="credentialId">
              Credential ID
            </label>

            <input
              id="credentialId"
              className="credential-input"
              placeholder="Enter or select a credential ID"
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
                      Issued At
                    </span>

                    <strong>
                      {new Date(
                        verificationResult
                          .credential.issuedAt
                      ).toLocaleString()}
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
                        : "❌ No"}
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
                </div>
              </div>
            )}

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
                        {credential.type}
                      </strong>

                      <p>
                        {credential.id}
                      </p>

                      <p>
                        Holder:{" "}
                        {credential.holderDID}
                      </p>

                      <p>
                        Issued:{" "}
                        {new Date(
                          credential.issuedAt
                        ).toLocaleString()}
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
              React
            </strong>

            <span>
              Frontend
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