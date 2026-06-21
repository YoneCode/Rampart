// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";
import {RampartVaultFactory} from "../src/RampartVaultFactory.sol";

/// @notice Deploys the self-serve factory. A fresh AgentRegistry is created and its ownership
///         transferred to the factory (so it can register each user's agent). The shared,
///         already-deployed AuditAnchor is reused for the on-chain decision hash-chains.
/// Run: forge script script/DeployFactory.s.sol:DeployFactoryScript --rpc-url ritual --broadcast -vvvv
contract DeployFactoryScript is Script {
    AuditAnchor constant AUDIT = AuditAnchor(0x9422817DC2E84bd91dD3715DDd7d466F2977D7a3);

    function run() external {
        uint256 pk = vm.envUint("ACCOUNT_PRIVATE_KEY");
        vm.startBroadcast(pk);

        AgentRegistry registry = new AgentRegistry();
        RampartVaultFactory factory = new RampartVaultFactory(registry, AUDIT);
        registry.transferOwnership(address(factory));

        vm.stopBroadcast();

        console.log("AgentRegistry (factory-owned):", address(registry));
        console.log("RampartVaultFactory:          ", address(factory));
        console.log("AuditAnchor (shared):         ", address(AUDIT));
    }
}
