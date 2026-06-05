// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {Policy} from "../src/RampartTypes.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";
import {RampartVault} from "../src/RampartVault.sol";
import {RampartSentinel, IRampartVault} from "../src/RampartSentinel.sol";
import {RitualAddresses} from "../src/lib/RitualAddresses.sol";

contract RampartSentinelTest is Test {
    AgentRegistry registry;
    AuditAnchor audit;
    RampartVault vault;
    RampartSentinel sentinel;

    address constant SCHEDULER = RitualAddresses.SCHEDULER;
    address constant HTTP = RitualAddresses.HTTP_PRECOMPILE;
    address constant JQ = RitualAddresses.JQ_PRECOMPILE;
    address executor = address(0xE1);
    bytes32 constant AGENT_ID = keccak256("rampart-agent-1");

    function setUp() public {
        registry = new AgentRegistry();
        audit = new AuditAnchor();
        registry.registerAgent(AGENT_ID, address(0xA9E27), keccak256("model-v1"));

        Policy memory p = Policy({
            maxTxValueWei: 5 ether,
            maxDailySpendWei: 10 ether,
            maxSlippageBps: 200,
            drawdownLimitBps: 1500, // 15%
            defaultTtl: 0
        });
        address[] memory targets = new address[](0);
        address[] memory tokens = new address[](0);

        vault = new RampartVault(address(this), registry, audit, AGENT_ID, p, targets, tokens);
        sentinel = new RampartSentinel(address(this), IRampartVault(address(vault)));

        // authorize the sentinel to feed the breaker, then configure it
        vault.setReporter(address(sentinel));
        sentinel.configure(executor, "https://api.example.com/portfolio", ".valueWei");
    }

    /// @dev Build the short-running async envelope an HTTP precompile call returns.
    function _httpEnvelope(bytes memory body) internal pure returns (bytes memory) {
        bytes memory actualOutput = abi.encode(
            uint16(200), new string[](0), new string[](0), body, ""
        );
        return abi.encode(bytes(""), actualOutput);
    }

    function _mockPrecompiles(uint256 value) internal {
        vm.mockCall(HTTP, _httpEnvelope(bytes('{"valueWei":"x"}')), bytes(""));
        // match any HTTP call regardless of input by mocking on empty selector prefix
        vm.mockCall(HTTP, bytes(""), _httpEnvelope(bytes('{"valueWei":"x"}')));
        vm.mockCall(JQ, bytes(""), abi.encode(value));
    }

    function _wake(uint256 value, uint256 idx) internal {
        _mockPrecompiles(value);
        vm.prank(SCHEDULER);
        sentinel.runHealthCheck(idx);
    }

    function test_sentinel_reportsValueAndSetsHighWaterMark() public {
        _wake(100 ether, 0);
        assertEq(sentinel.lastReportedValue(), 100 ether);
        assertEq(sentinel.checkCount(), 1);
        assertEq(vault.highWaterMark(), 100 ether);
        assertFalse(vault.paused());
    }

    function test_sentinel_tripsCircuitBreakerOnDrawdown() public {
        _wake(100 ether, 0); // set HWM
        _wake(84 ether, 1);  // 16% drawdown >= 15% threshold
        assertTrue(vault.paused());
    }

    function test_runHealthCheck_onlyScheduler() public {
        _mockPrecompiles(100 ether);
        vm.expectRevert(RampartSentinel.OnlyScheduler.selector);
        sentinel.runHealthCheck(0);
    }

    function test_startMonitoring_requiresConfig() public {
        RampartSentinel fresh = new RampartSentinel(address(this), IRampartVault(address(vault)));
        vm.expectRevert(RampartSentinel.NotConfigured.selector);
        fresh.startMonitoring(50, 24, 300_000, 1 gwei, 50);
    }

    function test_startMonitoring_schedules() public {
        vm.mockCall(SCHEDULER, bytes(""), abi.encode(uint256(42)));
        uint256 id = sentinel.startMonitoring(50, 24, 300_000, 1 gwei, 50);
        assertEq(id, 42);
        assertEq(sentinel.activeScheduleId(), 42);
    }
}
