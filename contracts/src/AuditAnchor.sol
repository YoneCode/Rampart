// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title AuditAnchor
/// @notice Append-only, tamper-evident record of every firewall decision.
/// @dev Each vault gets its own keccak hash-chain keyed by `msg.sender` (the vault).
///      Anyone can verify completeness by replaying recorded events against `latestRoot`.
contract AuditAnchor {
    mapping(address => bytes32) public latestRoot;    // vault => current chained root
    mapping(address => uint256) public decisionCount; // vault => number of decisions

    event DecisionRecorded(
        address indexed vault,
        uint256 indexed nonce,
        bytes32 actionHash,
        uint8 code,
        bool allowed,
        bytes32 newRoot,
        uint256 index
    );

    /// @notice Anchor a firewall decision. Called by a vault; chained per caller.
    /// @return newRoot the updated hash-chain root for the calling vault.
    function record(uint256 nonce, bytes32 actionHash, uint8 code, bool allowed)
        external
        returns (bytes32 newRoot)
    {
        bytes32 prev = latestRoot[msg.sender];
        newRoot = keccak256(
            abi.encode(prev, msg.sender, nonce, actionHash, code, allowed, block.number)
        );
        latestRoot[msg.sender] = newRoot;
        uint256 index = decisionCount[msg.sender]++;
        emit DecisionRecorded(msg.sender, nonce, actionHash, code, allowed, newRoot, index);
    }
}
