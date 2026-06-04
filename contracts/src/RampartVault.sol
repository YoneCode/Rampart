// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Policy, ActionRequest, DecisionCode} from "./RampartTypes.sol";
import {RampartPolicy} from "./lib/RampartPolicy.sol";
import {AgentRegistry} from "./AgentRegistry.sol";
import {AuditAnchor} from "./AuditAnchor.sol";
import {Ownable} from "./auth/Ownable.sol";
import {ReentrancyGuard} from "./utils/ReentrancyGuard.sol";

/// @title RampartVault
/// @notice Custody vault whose funds an AI agent manages, but every consequential
///         action passes through an on-chain, deterministic policy firewall first.
/// @dev The firewall runs in replicated EVM (fully trustless). The agent's reasoning
///      runs off-chain in a TEE via Ritual precompiles; only the proposed ActionRequest
///      reaches this contract, where it is gated regardless of what the agent "decided".
contract RampartVault is Ownable, ReentrancyGuard {
    // ---- wiring ----
    AgentRegistry public immutable agentRegistry;
    AuditAnchor   public immutable auditAnchor;
    bytes32 public agentId; // the agent authorized to propose actions for this vault

    // ---- policy ----
    Policy   public policy;
    bytes32  public policyHash; // commitment to (policy, targetList, tokenList)
    bool     public paused;
    uint256  public expectedNonce;

    // allowlists (mapping for O(1) checks + arrays for enumeration/hashing)
    mapping(address => bool) public allowedTarget;
    mapping(address => bool) public allowedToken;
    address[] public targetList;
    address[] public tokenList;

    // ---- rolling 24h spend window ----
    uint256 public constant WINDOW = 1 days;
    uint256 public windowStart;
    uint256 public windowSpent;

    // ---- policy-update timelock ----
    uint256 public constant POLICY_TIMELOCK = 1 days;
    bytes32 public pendingPolicyHash;
    uint256 public pendingPolicyEta;

    // ---- circuit breaker ----
    uint256 public highWaterMark; // reference portfolio value (native), updated by health checks
    address public reporter;      // authorized health-check reporter (e.g. RampartSentinel)

    address internal constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;

    // ---- events ----
    event Deposited(address indexed from, uint256 amount);
    event ActionExecuted(uint256 indexed nonce, address indexed target, uint256 value, bytes32 actionHash, bytes32 auditRoot);
    event ActionDenied(uint256 indexed nonce, address indexed target, uint8 code, bytes32 actionHash, bytes32 auditRoot);
    event PausedSet(bool paused, string reason);
    event PolicyUpdateQueued(bytes32 newHash, uint256 eta);
    event PolicyUpdated(bytes32 newHash);
    event PortfolioReported(uint256 value, uint256 highWaterMark, bool tripped);
    event ReporterSet(address indexed reporter);
    event Withdrawn(address indexed to, uint256 amount);

    // ---- errors ----
    error NotAgentController();
    error TimelockNotReady();
    error PolicyHashMismatch();
    error ActionCallFailed();
    error Unauthorized();

    constructor(
        address _owner,
        AgentRegistry _agentRegistry,
        AuditAnchor _auditAnchor,
        bytes32 _agentId,
        Policy memory _policy,
        address[] memory _targets,
        address[] memory _tokens
    ) Ownable(_owner) {
        agentRegistry = _agentRegistry;
        auditAnchor = _auditAnchor;
        agentId = _agentId;
        policy = _policy;
        for (uint256 i; i < _targets.length; i++) {
            if (!allowedTarget[_targets[i]]) {
                allowedTarget[_targets[i]] = true;
                targetList.push(_targets[i]);
            }
        }
        for (uint256 i; i < _tokens.length; i++) {
            if (!allowedToken[_tokens[i]]) {
                allowedToken[_tokens[i]] = true;
                tokenList.push(_tokens[i]);
            }
        }
        policyHash = _computePolicyHash();
        windowStart = block.timestamp;
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    // ---- views ----

    function _computePolicyHash() internal view returns (bytes32) {
        return keccak256(abi.encode(policy, targetList, tokenList));
    }

    function currentDailySpent() public view returns (uint256) {
        if (block.timestamp >= windowStart + WINDOW) return 0;
        return windowSpent;
    }

    /// @notice Pure read of the firewall decision for a proposed action (no state change).
    function evaluate(ActionRequest memory a) public view returns (DecisionCode) {
        bool tokenOk = (a.tokenIn == address(0)) ? true : allowedToken[a.tokenIn];
        return RampartPolicy.evaluate(
            policy,
            a,
            paused,
            expectedNonce,
            currentDailySpent(),
            allowedTarget[a.target],
            tokenOk,
            block.timestamp
        );
    }

    function targetCount() external view returns (uint256) { return targetList.length; }
    function tokenCount() external view returns (uint256) { return tokenList.length; }

    // ---- core: agent proposes, firewall gates ----

    /// @notice Agent submits a proposed action. The firewall evaluates it; on ALLOW the
    ///         vault executes the call, otherwise it records a deny (no revert).
    function executeAction(ActionRequest calldata a)
        external
        nonReentrant
        returns (DecisionCode code)
    {
        (address controller, , bool active) = agentRegistry.agents(agentId);
        if (msg.sender != controller || !active) revert NotAgentController();

        ActionRequest memory am = a;
        code = evaluate(am);
        bytes32 actionHash = keccak256(abi.encode(a));

        if (code != DecisionCode.ALLOW) {
            bytes32 deniedRoot = auditAnchor.record(a.nonce, actionHash, uint8(code), false);
            emit ActionDenied(a.nonce, a.target, uint8(code), actionHash, deniedRoot);
            return code; // denial is a normal, recorded outcome — not a revert
        }

        // EFFECTS (before INTERACTIONS)
        expectedNonce = a.nonce + 1;
        _accrueSpend(a.value);
        bytes32 root = auditAnchor.record(a.nonce, actionHash, uint8(DecisionCode.ALLOW), true);

        // INTERACTION
        (bool ok, ) = a.target.call{value: a.value}(a.callData);
        if (!ok) revert ActionCallFailed();

        emit ActionExecuted(a.nonce, a.target, a.value, actionHash, root);
    }

    function _accrueSpend(uint256 v) internal {
        if (block.timestamp >= windowStart + WINDOW) {
            windowStart = block.timestamp;
            windowSpent = 0;
        }
        windowSpent += v;
    }

    // ---- circuit breaker ----

    /// @notice Report current portfolio value (native units). Trips the breaker (pause)
    ///         if drawdown vs the high-water mark exceeds the policy threshold.
    /// @dev Authorized: owner, or AsyncDelivery (a TEE health-check result delivered on-chain).
    function reportPortfolioValue(uint256 currentValueWei) external {
        if (msg.sender != owner && msg.sender != reporter && msg.sender != ASYNC_DELIVERY) revert Unauthorized();
        bool tripped;
        if (currentValueWei > highWaterMark) {
            highWaterMark = currentValueWei;
        } else if (highWaterMark > 0) {
            uint256 ddBps = ((highWaterMark - currentValueWei) * 10_000) / highWaterMark;
            if (ddBps >= policy.drawdownLimitBps) {
                paused = true;
                tripped = true;
                emit PausedSet(true, "drawdown circuit breaker");
            }
        }
        emit PortfolioReported(currentValueWei, highWaterMark, tripped);
    }

    // ---- owner controls ----

    function setPaused(bool p, string calldata reason) external onlyOwner {
        paused = p;
        emit PausedSet(p, reason);
    }

    /// @notice Authorize a health-check reporter (e.g. the scheduled RampartSentinel)
    ///         to call `reportPortfolioValue`.
    function setReporter(address r) external onlyOwner {
        reporter = r;
        emit ReporterSet(r);
    }

    function queuePolicyUpdate(bytes32 newHash) external onlyOwner {
        pendingPolicyHash = newHash;
        pendingPolicyEta = block.timestamp + POLICY_TIMELOCK;
        emit PolicyUpdateQueued(newHash, pendingPolicyEta);
    }

    /// @notice Apply a queued policy update after the timelock. The supplied values must
    ///         hash to the previously queued commitment.
    function applyPolicyUpdate(
        Policy calldata newPolicy,
        address[] calldata newTargets,
        address[] calldata newTokens
    ) external onlyOwner {
        if (pendingPolicyHash == bytes32(0) || block.timestamp < pendingPolicyEta) revert TimelockNotReady();
        bytes32 h = keccak256(abi.encode(newPolicy, newTargets, newTokens));
        if (h != pendingPolicyHash) revert PolicyHashMismatch();

        // clear old allowlists
        for (uint256 i; i < targetList.length; i++) allowedTarget[targetList[i]] = false;
        for (uint256 i; i < tokenList.length; i++) allowedToken[tokenList[i]] = false;
        delete targetList;
        delete tokenList;

        // set new
        policy = newPolicy;
        for (uint256 i; i < newTargets.length; i++) {
            if (!allowedTarget[newTargets[i]]) {
                allowedTarget[newTargets[i]] = true;
                targetList.push(newTargets[i]);
            }
        }
        for (uint256 i; i < newTokens.length; i++) {
            if (!allowedToken[newTokens[i]]) {
                allowedToken[newTokens[i]] = true;
                tokenList.push(newTokens[i]);
            }
        }
        policyHash = h;
        pendingPolicyHash = bytes32(0);
        pendingPolicyEta = 0;
        emit PolicyUpdated(h);
    }

    /// @notice Owner withdrawal of native funds (e.g., wind-down). Not gated by the firewall.
    function withdraw(address to, uint256 amount) external onlyOwner nonReentrant {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert ActionCallFailed();
        emit Withdrawn(to, amount);
    }
}
