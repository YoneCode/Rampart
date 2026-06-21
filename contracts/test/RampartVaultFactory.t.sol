// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {Policy, ActionRequest, DecisionCode} from "../src/RampartTypes.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";
import {RampartVault} from "../src/RampartVault.sol";
import {RampartVaultFactory} from "../src/RampartVaultFactory.sol";

contract MockProtocol {
    uint256 public totalReceived;
    function doSwap(uint256) external payable { totalReceived += msg.value; }
    receive() external payable {}
}

contract RampartVaultFactoryTest is Test {
    AgentRegistry registry;
    AuditAnchor audit;
    RampartVaultFactory factory;
    MockProtocol allowed;

    address user = address(0xE5E2);

    function setUp() public {
        registry = new AgentRegistry();
        audit = new AuditAnchor();
        factory = new RampartVaultFactory(registry, audit);
        registry.transferOwnership(address(factory)); // factory can now register agents
        allowed = new MockProtocol();
    }

    function _policy() internal pure returns (Policy memory) {
        return Policy({
            maxTxValueWei: 2 ether,
            maxDailySpendWei: 10 ether,
            maxSlippageBps: 150,
            drawdownLimitBps: 1000,
            defaultTtl: 0
        });
    }

    function test_createVault_setsOwnerAndPolicy() public {
        address[] memory targets = new address[](1);
        targets[0] = address(allowed);
        address[] memory tokens = new address[](0);

        vm.prank(user);
        (address vaultAddr, bytes32 agentId) =
            factory.createVault(_policy(), targets, tokens, address(0), keccak256("m"));

        RampartVault vault = RampartVault(payable(vaultAddr));
        assertEq(vault.owner(), user);                       // user owns their vault
        assertEq(vault.agentId(), agentId);
        ( , , uint16 slip, , ) = vault.policy();
        assertEq(slip, 150);

        // controller defaulted to the user; registry knows it
        (address controller, , bool active) = registry.agents(agentId);
        assertEq(controller, user);
        assertTrue(active);

        // tracked under the owner
        assertEq(factory.vaultCountOf(user), 1);
        assertEq(factory.totalVaults(), 1);
        assertEq(factory.getVaults(user)[0], vaultAddr);
    }

    function test_userControlsOwnVaultFirewall() public {
        address[] memory targets = new address[](1);
        targets[0] = address(allowed);
        address[] memory tokens = new address[](0);

        vm.prank(user);
        (address vaultAddr, ) =
            factory.createVault(_policy(), targets, tokens, address(0), bytes32(0));
        RampartVault vault = RampartVault(payable(vaultAddr));
        vm.deal(vaultAddr, 5 ether);

        // user (the registered controller) proposes a valid action -> ALLOW + executes
        ActionRequest memory ok = ActionRequest({
            nonce: 0, target: address(allowed), value: 1 ether,
            callData: abi.encodeWithSignature("doSwap(uint256)", uint256(0)),
            tokenIn: address(0), amountIn: 0, slippageBps: 100, deadline: 0
        });
        vm.prank(user);
        DecisionCode code = vault.executeAction(ok);
        assertEq(uint8(code), uint8(DecisionCode.ALLOW));
        assertEq(allowed.totalReceived(), 1 ether);

        // oversized action -> firewall blocks it
        ActionRequest memory big = ok;
        big.nonce = 1; big.value = 3 ether; // > 2 ether cap
        vm.prank(user);
        DecisionCode code2 = vault.executeAction(big);
        assertEq(uint8(code2), uint8(DecisionCode.DENY_VALUE_LIMIT));
    }

    function test_multipleUsersIndependentVaults() public {
        address[] memory t = new address[](0);
        address userB = address(0xB0B);
        vm.prank(user); factory.createVault(_policy(), t, t, address(0), bytes32(0));
        vm.prank(userB); factory.createVault(_policy(), t, t, address(0), bytes32(0));
        assertEq(factory.vaultCountOf(user), 1);
        assertEq(factory.vaultCountOf(userB), 1);
        assertEq(factory.totalVaults(), 2);
        assertTrue(factory.getVaults(user)[0] != factory.getVaults(userB)[0]);
    }
}
