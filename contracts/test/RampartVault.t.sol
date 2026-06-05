// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {Policy, ActionRequest, DecisionCode} from "../src/RampartTypes.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";
import {RampartVault} from "../src/RampartVault.sol";

/// @dev A stand-in for an allowlisted DeFi protocol the agent is permitted to call.
contract MockProtocol {
    event Hit(uint256 value, uint256 minOut);
    uint256 public totalReceived;

    function doSwap(uint256 minOut) external payable {
        totalReceived += msg.value;
        emit Hit(msg.value, minOut);
    }

    receive() external payable {}
}

contract RampartVaultTest is Test {
    AgentRegistry registry;
    AuditAnchor audit;
    RampartVault vault;
    MockProtocol allowed;      // allowlisted target
    MockProtocol disallowed;   // NOT allowlisted

    address agent = address(0xA9E27);     // the registered agent controller
    address attacker = address(0xBAD);    // a non-allowlisted destination
    bytes32 constant AGENT_ID = keccak256("rampart-agent-1");

    function setUp() public {
        registry = new AgentRegistry();
        audit = new AuditAnchor();
        allowed = new MockProtocol();
        disallowed = new MockProtocol();

        // owner (this test) registers the agent
        registry.registerAgent(AGENT_ID, agent, keccak256("model-v1"));

        Policy memory p = Policy({
            maxTxValueWei: 5 ether,
            maxDailySpendWei: 10 ether,
            maxSlippageBps: 200,      // 2%
            drawdownLimitBps: 1500,   // 15%
            defaultTtl: 0
        });

        address[] memory targets = new address[](1);
        targets[0] = address(allowed);
        address[] memory tokens = new address[](0); // native-only for this vault

        vault = new RampartVault(
            address(this), registry, audit, AGENT_ID, p, targets, tokens
        );

        // fund the vault
        vm.deal(address(vault), 100 ether);
    }

    // ---- helpers ----

    function _action(uint256 nonce, address target, uint256 value, uint16 slippageBps)
        internal
        pure
        returns (ActionRequest memory a)
    {
        a = ActionRequest({
            nonce: nonce,
            target: target,
            value: value,
            callData: abi.encodeWithSignature("doSwap(uint256)", uint256(0)),
            tokenIn: address(0),
            amountIn: 0,
            slippageBps: slippageBps,
            deadline: 0
        });
    }

    function _run(ActionRequest memory a) internal returns (DecisionCode) {
        vm.prank(agent);
        return vault.executeAction(a);
    }

    // ---- happy path ----

    function test_allow_validAction() public {
        DecisionCode code = _run(_action(0, address(allowed), 1 ether, 100));
        assertEq(uint8(code), uint8(DecisionCode.ALLOW));
        assertEq(allowed.totalReceived(), 1 ether);
        assertEq(vault.expectedNonce(), 1);
        assertEq(vault.currentDailySpent(), 1 ether);
    }

    // ---- 5 attack scenarios (must all be blocked) ----

    // (a) prompt injection: agent tricked into sending funds to a non-allowlisted address
    function test_block_promptInjection_unauthorizedDestination() public {
        DecisionCode code = _run(_action(0, attacker, 1 ether, 100));
        assertEq(uint8(code), uint8(DecisionCode.DENY_TARGET_NOT_ALLOWED));
        assertEq(attacker.balance, 0);
        assertEq(vault.expectedNonce(), 0); // denial does not advance nonce
    }

    // (b) oversized transaction beyond the per-tx limit
    function test_block_oversizedTransaction() public {
        DecisionCode code = _run(_action(0, address(allowed), 6 ether, 100));
        assertEq(uint8(code), uint8(DecisionCode.DENY_VALUE_LIMIT));
        assertEq(allowed.totalReceived(), 0);
    }

    // (c) daily spend cap exhaustion
    function test_block_dailyLimitExhaustion() public {
        assertEq(uint8(_run(_action(0, address(allowed), 5 ether, 100))), uint8(DecisionCode.ALLOW));
        assertEq(uint8(_run(_action(1, address(allowed), 5 ether, 100))), uint8(DecisionCode.ALLOW));
        // 10 ether spent; next spend exceeds the 10 ether daily cap
        DecisionCode code = _run(_action(2, address(allowed), 1 ether, 100));
        assertEq(uint8(code), uint8(DecisionCode.DENY_DAILY_LIMIT));
    }

    // (d) call to a disallowed protocol contract
    function test_block_disallowedProtocol() public {
        DecisionCode code = _run(_action(0, address(disallowed), 1 ether, 100));
        assertEq(uint8(code), uint8(DecisionCode.DENY_TARGET_NOT_ALLOWED));
        assertEq(disallowed.totalReceived(), 0);
    }

    // (e) slippage manipulation beyond the policy bound
    function test_block_slippageManipulation() public {
        DecisionCode code = _run(_action(0, address(allowed), 1 ether, 300)); // 3% > 2% cap
        assertEq(uint8(code), uint8(DecisionCode.DENY_SLIPPAGE));
        assertEq(allowed.totalReceived(), 0);
    }

    // ---- additional firewall guarantees ----

    function test_block_replayBadNonce() public {
        DecisionCode code = _run(_action(7, address(allowed), 1 ether, 100));
        assertEq(uint8(code), uint8(DecisionCode.DENY_BAD_NONCE));
    }

    function test_block_whenPaused() public {
        vault.setPaused(true, "test pause");
        DecisionCode code = _run(_action(0, address(allowed), 1 ether, 100));
        assertEq(uint8(code), uint8(DecisionCode.DENY_PAUSED));
    }

    function test_onlyAgentControllerCanPropose() public {
        ActionRequest memory a = _action(0, address(allowed), 1 ether, 100);
        vm.prank(attacker);
        vm.expectRevert(RampartVault.NotAgentController.selector);
        vault.executeAction(a);
    }

    function test_circuitBreaker_trippedByDrawdown() public {
        vault.reportPortfolioValue(100 ether); // sets high-water mark
        vault.reportPortfolioValue(84 ether);  // 16% drawdown >= 15% threshold
        assertTrue(vault.paused());
        DecisionCode code = _run(_action(0, address(allowed), 1 ether, 100));
        assertEq(uint8(code), uint8(DecisionCode.DENY_PAUSED));
    }

    function test_auditAnchor_recordsAndChains() public {
        _run(_action(0, address(allowed), 1 ether, 100)); // allow
        _run(_action(1, attacker, 1 ether, 100));         // deny (target)
        assertEq(audit.decisionCount(address(vault)), 2);
        assertTrue(audit.latestRoot(address(vault)) != bytes32(0));
    }
}
