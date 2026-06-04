// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Policy} from "../src/RampartTypes.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";
import {RampartVault} from "../src/RampartVault.sol";
import {RampartAgent, IVaultExec} from "../src/RampartAgent.sol";
import {RampartSentinel, IRampartVault} from "../src/RampartSentinel.sol";

/// @notice Deploys and wires the Rampart contract suite to Ritual Chain (1979).
/// @dev Reads the deployer key from `ACCOUNT_PRIVATE_KEY`. Policy parameters and the
///      initial allowlisted target / LLM executor are read from env with safe defaults.
///      Run: forge script script/Deploy.s.sol:DeployScript --rpc-url ritual --broadcast -vvvv
contract DeployScript is Script {
    bytes32 constant AGENT_ID = keccak256("rampart-agent-1");

    function run() external {
        uint256 pk = vm.envUint("ACCOUNT_PRIVATE_KEY");
        address deployer = vm.addr(pk);

        // Policy params (overridable via env)
        Policy memory policy = Policy({
            maxTxValueWei: vm.envOr("RAMPART_MAX_TX_VALUE", uint256(5 ether)),
            maxDailySpendWei: vm.envOr("RAMPART_MAX_DAILY", uint256(50 ether)),
            maxSlippageBps: uint16(vm.envOr("RAMPART_MAX_SLIPPAGE_BPS", uint256(200))),
            drawdownLimitBps: uint16(vm.envOr("RAMPART_DRAWDOWN_BPS", uint256(1500))),
            defaultTtl: 0
        });

        address allowedTarget = vm.envOr("RAMPART_ALLOWED_TARGET", address(0));
        address llmExecutor = vm.envOr("RAMPART_LLM_EXECUTOR", address(0));

        uint256 nTargets = allowedTarget == address(0) ? 0 : 1;
        address[] memory targets = new address[](nTargets);
        if (nTargets == 1) targets[0] = allowedTarget;
        address[] memory tokens = new address[](0);

        vm.startBroadcast(pk);

        AgentRegistry registry = new AgentRegistry();
        AuditAnchor audit = new AuditAnchor();

        RampartVault vault = new RampartVault(
            deployer, registry, audit, AGENT_ID, policy, targets, tokens
        );
        RampartAgent agent = new RampartAgent(deployer, IVaultExec(address(vault)));
        RampartSentinel sentinel = new RampartSentinel(deployer, IRampartVault(address(vault)));

        // Wiring: the on-chain agent contract is the vault's authorized controller;
        // the sentinel is the authorized circuit-breaker reporter.
        registry.registerAgent(AGENT_ID, address(agent), keccak256("rampart-model-v1"));
        vault.setReporter(address(sentinel));
        if (llmExecutor != address(0)) agent.setExecutor(llmExecutor);

        vm.stopBroadcast();

        console.log("Deployer:       ", deployer);
        console.log("AgentRegistry:  ", address(registry));
        console.log("AuditAnchor:    ", address(audit));
        console.log("RampartVault:   ", address(vault));
        console.log("RampartAgent:   ", address(agent));
        console.log("RampartSentinel:", address(sentinel));
    }
}
