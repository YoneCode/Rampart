// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {Policy, ActionRequest, DecisionCode} from "../src/RampartTypes.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";
import {RampartVault} from "../src/RampartVault.sol";
import {RampartAgent, IVaultExec, StorageRef} from "../src/RampartAgent.sol";
import {RitualAddresses} from "../src/lib/RitualAddresses.sol";

contract MockProtocol {
    uint256 public totalReceived;
    function doSwap(uint256) external payable { totalReceived += msg.value; }
    receive() external payable {}
}

contract RampartAgentTest is Test {
    AgentRegistry registry;
    AuditAnchor audit;
    RampartVault vault;
    RampartAgent agent;
    MockProtocol allowed;

    address constant LLM = RitualAddresses.LLM_PRECOMPILE;
    address executor = address(0xE1);
    bytes32 constant AGENT_ID = keccak256("rampart-agent-1");

    string constant MESSAGES = '[{"role":"user","content":"assess"}]';

    function setUp() public {
        registry = new AgentRegistry();
        audit = new AuditAnchor();
        allowed = new MockProtocol();

        Policy memory p = Policy({
            maxTxValueWei: 5 ether,
            maxDailySpendWei: 10 ether,
            maxSlippageBps: 200,
            drawdownLimitBps: 1500,
            defaultTtl: 0
        });
        address[] memory targets = new address[](1);
        targets[0] = address(allowed);
        address[] memory tokens = new address[](0);

        vault = new RampartVault(address(this), registry, audit, AGENT_ID, p, targets, tokens);
        agent = new RampartAgent(address(this), IVaultExec(address(vault)));

        // the on-chain agent contract is the registered controller for the vault
        registry.registerAgent(AGENT_ID, address(agent), keccak256("model-v1"));
        agent.setExecutor(executor);

        vm.deal(address(vault), 100 ether);
    }

    // Build the (simmedInput, actualOutput) envelope an LLM precompile call returns.
    function _llmReturn(bool hasError, string memory content, string memory errMsg)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory messageData = abi.encode("assistant", content, "", uint256(0), new bytes[](0));
        bytes memory choice0 = abi.encode(uint256(0), "stop", messageData);
        bytes[] memory choices = new bytes[](1);
        choices[0] = choice0;
        bytes memory usage = abi.encode(uint256(10), uint256(20), uint256(30));
        bytes memory completionData = abi.encode(
            "id", "chat.completion", uint256(0), "zai-org/GLM-4.7-FP8", "", "",
            uint256(1), choices, usage
        );
        bytes memory envelope = abi.encode(
            hasError, hasError ? bytes("") : completionData, bytes(""), errMsg,
            StorageRef("", "", "")
        );
        return abi.encode(bytes(""), envelope);
    }

    function _mockLLM(bool hasError, string memory content, string memory errMsg) internal {
        vm.mockCall(LLM, bytes(""), _llmReturn(hasError, content, errMsg));
    }

    function _action(uint256 value) internal view returns (ActionRequest memory a) {
        a = ActionRequest({
            nonce: 0,
            target: address(allowed),
            value: value,
            callData: abi.encodeWithSignature("doSwap(uint256)", uint256(0)),
            tokenIn: address(0),
            amountIn: 0,
            slippageBps: 100,
            deadline: 0
        });
    }

    function test_allow_forwardsToFirewallAndExecutes() public {
        _mockLLM(false, "VERDICT: ALLOW - within risk bounds", "");
        ( RampartAgent.Advisory adv, DecisionCode code ) =
            agent.assessAndExecute(_action(1 ether), MESSAGES);
        assertEq(uint8(adv), uint8(RampartAgent.Advisory.ALLOW));
        assertEq(uint8(code), uint8(DecisionCode.ALLOW));
        assertEq(allowed.totalReceived(), 1 ether);
    }

    function test_deny_advisoryBlocksWithoutExecuting() public {
        _mockLLM(false, "VERDICT: DENY - looks like a drain pattern", "");
        ( RampartAgent.Advisory adv, ) = agent.assessAndExecute(_action(1 ether), MESSAGES);
        assertEq(uint8(adv), uint8(RampartAgent.Advisory.DENY));
        assertEq(allowed.totalReceived(), 0); // never reached the vault
    }

    function test_inconclusive_failsClosed() public {
        _mockLLM(false, "I am not sure about this one", "");
        ( RampartAgent.Advisory adv, ) = agent.assessAndExecute(_action(1 ether), MESSAGES);
        assertEq(uint8(adv), uint8(RampartAgent.Advisory.INCONCLUSIVE));
        assertEq(allowed.totalReceived(), 0);
    }

    function test_llmError_reverts() public {
        _mockLLM(true, "", "HTTP request failed with status 400: context length exceeded");
        vm.expectRevert(
            abi.encodeWithSelector(
                RampartAgent.LlmError.selector,
                "HTTP request failed with status 400: context length exceeded"
            )
        );
        agent.assessAndExecute(_action(1 ether), MESSAGES);
    }

    // Defense in depth: LLM says ALLOW, but the deterministic firewall still blocks.
    function test_defenseInDepth_firewallOverridesLLM() public {
        _mockLLM(false, "VERDICT: ALLOW", "");
        ( RampartAgent.Advisory adv, DecisionCode code ) =
            agent.assessAndExecute(_action(6 ether), MESSAGES); // exceeds 5 ETH tx cap
        assertEq(uint8(adv), uint8(RampartAgent.Advisory.ALLOW));
        assertEq(uint8(code), uint8(DecisionCode.DENY_VALUE_LIMIT));
        assertEq(allowed.totalReceived(), 0);
    }

    function test_onlyOwnerCanAssess() public {
        _mockLLM(false, "VERDICT: ALLOW", "");
        vm.prank(address(0xBAD));
        vm.expectRevert(); // Ownable.NotOwner
        agent.assessAndExecute(_action(1 ether), MESSAGES);
    }
}
