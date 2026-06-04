// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "./auth/Ownable.sol";
import {RitualAddresses} from "./lib/RitualAddresses.sol";
import {ActionRequest, DecisionCode} from "./RampartTypes.sol";

interface IVaultExec {
    function executeAction(ActionRequest calldata a) external returns (DecisionCode);
}

/// @notice DA conversation-history reference (see ritual-dapp-da). Encoded as the
///         (string,string,string) tuple the LLM precompile expects at field 29.
struct StorageRef {
    string platform;
    string path;
    string keyRef;
}

/// @title RampartAgent
/// @notice On-chain reasoning agent. It asks the Ritual LLM precompile (0x0802,
///         `zai-org/GLM-4.7-FP8`, in a TEE) for a soft risk verdict on a proposed action,
///         records the reasoning provenance, and — only if the model advises ALLOW —
///         forwards the action to the vault, whose deterministic firewall remains the
///         sole binding authority. Defense in depth: the LLM can catch semantic threats
///         the rules miss; the rules catch anything the (manipulable) model gets wrong.
/// @dev Honors one-async-precompile-per-tx: the LLM call is the only async call; the
///      subsequent vault.executeAction is a normal call within the same fulfilled-replay tx.
///      The LLM result is read inline (short-running async), NOT via a callback.
contract RampartAgent is Ownable {
    address public constant LLM = RitualAddresses.LLM_PRECOMPILE;
    string  public constant MODEL = "zai-org/GLM-4.7-FP8";

    IVaultExec public immutable vault;

    address public executor;        // TEE executor (LLM capability) from TEEServiceRegistry
    uint256 public llmTtl = 300;    // >= 60 recommended for the reasoning model
    int256  public maxCompletionTokens = 4096; // >= 4096 for GLM reasoning model

    // conversation-history StorageRef (see ritual-dapp-da). Empty tuple = no persistence.
    string public daPlatform;
    string public daPath;
    string public daKeyRef;

    // last assessment (provenance)
    bytes32 public lastActionHash;
    bytes32 public lastReasoningHash;
    Advisory public lastAdvisory;
    DecisionCode public lastFirewallCode;

    enum Advisory { INCONCLUSIVE, ALLOW, DENY }

    event ExecutorSet(address indexed executor);
    event Assessed(bytes32 indexed actionHash, Advisory advisory, uint8 firewallCode, bytes32 reasoningHash);
    event AdvisoryBlocked(bytes32 indexed actionHash, Advisory advisory, bytes32 reasoningHash);

    error NotConfigured();
    error LlmCallFailed();
    error LlmError(string message);
    error NoChoices();

    constructor(address _owner, IVaultExec _vault) Ownable(_owner) {
        vault = _vault;
    }

    // ---- configuration ----

    function setExecutor(address _executor) external onlyOwner {
        executor = _executor;
        emit ExecutorSet(_executor);
    }

    function setLlmParams(uint256 _ttl, int256 _maxCompletionTokens) external onlyOwner {
        llmTtl = _ttl;
        maxCompletionTokens = _maxCompletionTokens;
    }

    function setConvoHistory(string calldata platform, string calldata path, string calldata keyRef)
        external
        onlyOwner
    {
        daPlatform = platform;
        daPath = path;
        daKeyRef = keyRef;
    }

    // ---- core ----

    /// @notice Get an LLM advisory on a proposed action; forward to the vault only on ALLOW.
    /// @param a The action to be gated (also independently enforced by the vault firewall).
    /// @param messagesJson OpenAI-style messages array (built by the trusted caller to avoid
    ///        on-chain JSON-escaping pitfalls). The prompt must instruct the model to reply
    ///        with `VERDICT: ALLOW` or `VERDICT: DENY`.
    function assessAndExecute(ActionRequest calldata a, string calldata messagesJson)
        external
        onlyOwner
        returns (Advisory advisory, DecisionCode firewallCode)
    {
        if (executor == address(0)) revert NotConfigured();

        // 1) LLM inference (the single async precompile call this tx)
        (bool ok, bytes memory raw) = LLM.call(_encodeLLMRequest(messagesJson));
        if (!ok) revert LlmCallFailed();

        // short-running async envelope: (simmedInput, actualOutput)
        (, bytes memory actualOutput) = abi.decode(raw, (bytes, bytes));

        // LLM response envelope — ALWAYS check has_error before touching completion data
        (
            bool hasError,
            bytes memory completionData,
            ,
            string memory errorMessage,
        ) = abi.decode(actualOutput, (bool, bytes, bytes, string, StorageRef));
        if (hasError) revert LlmError(errorMessage);

        string memory content = _extractContent(completionData);
        bytes32 reasoningHash = keccak256(bytes(content));
        bytes32 actionHash = keccak256(abi.encode(a));
        advisory = _verdict(content);

        lastActionHash = actionHash;
        lastReasoningHash = reasoningHash;
        lastAdvisory = advisory;

        // 2) Fail-closed: anything other than an explicit ALLOW is blocked here.
        if (advisory != Advisory.ALLOW) {
            lastFirewallCode = DecisionCode.DENY_PAUSED; // not executed
            emit AdvisoryBlocked(actionHash, advisory, reasoningHash);
            return (advisory, DecisionCode.DENY_PAUSED);
        }

        // 3) Binding gate: the deterministic firewall decides for real.
        firewallCode = vault.executeAction(a);
        lastFirewallCode = firewallCode;
        emit Assessed(actionHash, advisory, uint8(firewallCode), reasoningHash);
    }

    // ---- LLM request encoding (30-field ABI per ritual-dapp-llm) ----

    function _encodeLLMRequest(string memory messagesJson) internal view returns (bytes memory) {
        return abi.encode(
            executor,            // 0  executor
            new bytes[](0),      // 1  encryptedSecrets
            llmTtl,              // 2  ttl
            new bytes[](0),      // 3  secretSignatures
            bytes(""),           // 4  userPublicKey
            messagesJson,        // 5  messagesJson
            MODEL,               // 6  model
            int256(0),           // 7  frequencyPenalty
            "",                  // 8  logitBiasJson
            false,               // 9  logprobs
            maxCompletionTokens, // 10 maxCompletionTokens (>=4096)
            "",                  // 11 metadataJson
            "",                  // 12 modalitiesJson
            uint256(1),          // 13 n
            true,                // 14 parallelToolCalls
            int256(0),           // 15 presencePenalty
            "medium",            // 16 reasoningEffort
            bytes(""),           // 17 responseFormatData
            int256(-1),          // 18 seed
            "auto",              // 19 serviceTier
            "",                  // 20 stopJson
            false,               // 21 stream
            int256(0),           // 22 temperature (0 = deterministic advisory)
            bytes(""),           // 23 toolChoiceData
            bytes(""),           // 24 toolsData
            int256(-1),          // 25 topLogprobs
            int256(1000),        // 26 topP
            "",                  // 27 user
            false,               // 28 piiEnabled
            StorageRef(daPlatform, daPath, daKeyRef) // 29 convoHistory (StorageRef tuple)
        );
    }

    // ---- response decoding (per ritual-dapp-llm CompletionData layout) ----

    function _extractContent(bytes memory completionData) internal pure returns (string memory) {
        // CompletionData: (id, object, created, model, systemFingerprint, serviceTier,
        //                  choicesCount, choicesData[], usageData)
        (, , , , , , uint256 choicesCount, bytes[] memory choicesData, ) = abi.decode(
            completionData,
            (string, string, uint256, string, string, string, uint256, bytes[], bytes)
        );
        if (choicesCount == 0 || choicesData.length == 0) revert NoChoices();

        // choice: (index, finishReason, messageData)
        (, , bytes memory messageData) = abi.decode(choicesData[0], (uint256, string, bytes));
        // messageData: (role, content, refusal, toolCallsCount, toolCallsData[])
        (, string memory content, , , ) = abi.decode(
            messageData,
            (string, string, string, uint256, bytes[])
        );
        return content;
    }

    // ---- verdict extraction (defensive, fail-closed) ----

    function _verdict(string memory content) internal pure returns (Advisory) {
        bytes memory c = bytes(content);
        // DENY takes precedence (fail-closed). Bounded scan of the first 256 bytes.
        if (_contains(c, bytes("DENY"), 256)) return Advisory.DENY;
        if (_contains(c, bytes("ALLOW"), 256)) return Advisory.ALLOW;
        return Advisory.INCONCLUSIVE;
    }

    function _contains(bytes memory hay, bytes memory needle, uint256 maxScan)
        internal
        pure
        returns (bool)
    {
        uint256 n = hay.length < maxScan ? hay.length : maxScan;
        uint256 k = needle.length;
        if (k == 0 || n < k) return false;
        for (uint256 i = 0; i + k <= n; i++) {
            bool matched = true;
            for (uint256 j = 0; j < k; j++) {
                if (hay[i + j] != needle[j]) {
                    matched = false;
                    break;
                }
            }
            if (matched) return true;
        }
        return false;
    }

    receive() external payable {}
}
