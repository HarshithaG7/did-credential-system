// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RevocationRegistry {
    mapping(bytes32 => bool) private revokedCredentials;

    event CredentialRevoked(bytes32 indexed credentialId);

    function revokeCredential(bytes32 credentialId) public {
        revokedCredentials[credentialId] = true;
        emit CredentialRevoked(credentialId);
    }

    function isRevoked(bytes32 credentialId) public view returns (bool) {
        return revokedCredentials[credentialId];
    }
}