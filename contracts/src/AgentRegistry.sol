// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "./auth/Ownable.sol";

/// @title AgentRegistry
/// @notice Registry of agents authorized to propose actions to Rampart vaults.
/// @dev `modelHash` binds the agent identity to a model/code commitment for provenance.
contract AgentRegistry is Ownable {
    struct Agent {
        address controller; // EOA/contract allowed to submit proposals for this agent
        bytes32 modelHash;  // commitment to the agent's model/code
        bool    active;     // can be deactivated by the registry owner
    }

    mapping(bytes32 => Agent) public agents;

    event AgentRegistered(bytes32 indexed agentId, address indexed controller, bytes32 modelHash);
    event AgentStatusChanged(bytes32 indexed agentId, bool active);
    event AgentControllerChanged(bytes32 indexed agentId, address indexed newController);

    constructor() Ownable(msg.sender) {}

    function registerAgent(bytes32 agentId, address controller, bytes32 modelHash) external onlyOwner {
        require(agentId != bytes32(0), "bad agentId");
        require(controller != address(0), "bad controller");
        require(agents[agentId].controller == address(0), "already registered");
        agents[agentId] = Agent({controller: controller, modelHash: modelHash, active: true});
        emit AgentRegistered(agentId, controller, modelHash);
    }

    function setActive(bytes32 agentId, bool active) external onlyOwner {
        require(agents[agentId].controller != address(0), "unknown agent");
        agents[agentId].active = active;
        emit AgentStatusChanged(agentId, active);
    }

    function setController(bytes32 agentId, address newController) external onlyOwner {
        require(agents[agentId].controller != address(0), "unknown agent");
        require(newController != address(0), "bad controller");
        agents[agentId].controller = newController;
        emit AgentControllerChanged(agentId, newController);
    }

    function isActive(bytes32 agentId) external view returns (bool) {
        return agents[agentId].active;
    }
}
