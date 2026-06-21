// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Policy} from "./RampartTypes.sol";
import {RampartVault} from "./RampartVault.sol";
import {AgentRegistry} from "./AgentRegistry.sol";
import {AuditAnchor} from "./AuditAnchor.sol";

/// @title RampartVaultFactory
/// @notice Permissionless, self-serve deployment of per-user Rampart firewall vaults.
///         Each call deploys a fresh `RampartVault` owned by the caller, registers the
///         caller's chosen controller (their keeper EOA or agent) in a factory-owned
///         registry, and reuses the shared on-chain `AuditAnchor`.
/// @dev The factory must own `registry` (transfer ownership to it after deploy) so it can
///      register agents on each user's behalf. The vault is owned by the user, not the factory.
contract RampartVaultFactory {
    AgentRegistry public immutable registry;
    AuditAnchor public immutable auditAnchor;

    mapping(address => address[]) private _vaultsByOwner;
    address[] public allVaults;

    event VaultCreated(
        address indexed owner,
        address indexed vault,
        bytes32 agentId,
        address controller
    );

    constructor(AgentRegistry _registry, AuditAnchor _auditAnchor) {
        registry = _registry;
        auditAnchor = _auditAnchor;
    }

    /// @notice Deploy a firewall vault owned by the caller.
    /// @param policy Deterministic policy enforced on-chain by the vault.
    /// @param targets Initial allowlisted call targets.
    /// @param tokens Initial allowlisted tokens (empty = native only).
    /// @param controller Address permitted to propose actions (0 = caller's own address).
    /// @param modelHash Optional commitment to the controlling agent's model/code.
    function createVault(
        Policy calldata policy,
        address[] calldata targets,
        address[] calldata tokens,
        address controller,
        bytes32 modelHash
    ) external returns (address vaultAddr, bytes32 agentId) {
        address ctrl = controller == address(0) ? msg.sender : controller;
        agentId = keccak256(abi.encode(msg.sender, allVaults.length, block.number, block.prevrandao));

        RampartVault vault = new RampartVault(
            msg.sender, registry, auditAnchor, agentId, policy, targets, tokens
        );
        vaultAddr = address(vault);

        registry.registerAgent(agentId, ctrl, modelHash);

        _vaultsByOwner[msg.sender].push(vaultAddr);
        allVaults.push(vaultAddr);

        emit VaultCreated(msg.sender, vaultAddr, agentId, ctrl);
    }

    function getVaults(address owner) external view returns (address[] memory) {
        return _vaultsByOwner[owner];
    }

    function vaultCountOf(address owner) external view returns (uint256) {
        return _vaultsByOwner[owner].length;
    }

    function totalVaults() external view returns (uint256) {
        return allVaults.length;
    }
}
