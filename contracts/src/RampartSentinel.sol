// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "./auth/Ownable.sol";
import {RitualAddresses} from "./lib/RitualAddresses.sol";

interface IScheduler {
    function schedule(
        bytes calldata data,
        uint32 gas,
        uint32 startBlock,
        uint32 numCalls,
        uint32 frequency,
        uint32 ttl,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas,
        uint256 value,
        address payer
    ) external returns (uint256 callId);
    function cancel(uint256 callId) external;
}

interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
    function balanceOf(address account) external view returns (uint256);
}

interface IRampartVault {
    function reportPortfolioValue(uint256 currentValueWei) external;
}

/// @title RampartSentinel
/// @notice Scheduler-driven health monitor for a RampartVault. On each scheduled wake it
///         fetches the vault's portfolio value from an off-chain endpoint via the HTTP
///         precompile (short-running async), extracts the numeric value with the JQ
///         precompile (synchronous — so HTTP + JQ are allowed in the same tx), and reports
///         it to the vault, which trips its circuit breaker on excessive drawdown.
/// @dev Honors the one-async-precompile-per-tx rule: HTTP is the only async call per wake.
contract RampartSentinel is Ownable {
    IScheduler public constant SCHEDULER = IScheduler(RitualAddresses.SCHEDULER);
    address public constant RITUAL_WALLET = RitualAddresses.RITUAL_WALLET;
    address public constant HTTP = RitualAddresses.HTTP_PRECOMPILE;
    address public constant JQ = RitualAddresses.JQ_PRECOMPILE;

    IRampartVault public immutable vault;

    address public executor;     // TEE executor (from TEEServiceRegistry; owner-set, updatable)
    string  public valueUrl;     // endpoint returning JSON with the portfolio value
    string  public jqQuery;      // jq expression selecting a uint256 value (e.g. ".valueWei")
    uint256 public httpTtl = 50; // async TTL (blocks) for the HTTP commitment

    uint256 public activeScheduleId;
    uint256 public lastReportedValue;
    uint256 public lastCheckBlock;
    uint256 public checkCount;

    event Configured(address indexed executor, string url, string jqQuery);
    event MonitoringStarted(uint256 indexed callId, uint32 frequency, uint32 numCalls);
    event MonitoringCancelled(uint256 indexed callId);
    event HealthChecked(uint256 indexed executionIndex, uint256 value, uint256 blockNumber);

    error OnlyScheduler();
    error HttpFailed(string err);
    error HttpStatus(uint16 status);
    error JqFailed();
    error NotConfigured();

    constructor(address _owner, IRampartVault _vault) Ownable(_owner) {
        vault = _vault;
    }

    // ---- configuration ----

    function configure(address _executor, string calldata _url, string calldata _jqQuery)
        external
        onlyOwner
    {
        executor = _executor;
        valueUrl = _url;
        jqQuery = _jqQuery;
        emit Configured(_executor, _url, _jqQuery);
    }

    function setHttpTtl(uint256 ttlBlocks) external onlyOwner {
        httpTtl = ttlBlocks;
    }

    /// @notice Prepay precompile fees into RitualWallet for this contract.
    function depositForFees(uint256 lockDuration) external payable onlyOwner {
        IRitualWallet(RITUAL_WALLET).deposit{value: msg.value}(lockDuration);
    }

    // ---- scheduling ----

    /// @notice Begin recurring health checks. Sentinel pays its own fees from RitualWallet.
    /// @dev scheduler_ttl must cover drift + HTTP settlement (see ritual-dapp-scheduler).
    function startMonitoring(
        uint32 frequency,
        uint32 numCalls,
        uint32 gasLimit,
        uint256 maxFeePerGas,
        uint32 schedulerTtl
    ) external onlyOwner returns (uint256 callId) {
        if (executor == address(0) || bytes(valueUrl).length == 0) revert NotConfigured();
        bytes memory data = abi.encodeWithSelector(this.runHealthCheck.selector, uint256(0));
        callId = SCHEDULER.schedule(
            data,
            gasLimit,
            uint32(block.number) + frequency,
            numCalls,
            frequency,
            schedulerTtl,
            maxFeePerGas,
            0,
            0,
            address(this)
        );
        activeScheduleId = callId;
        emit MonitoringStarted(callId, frequency, numCalls);
    }

    function cancelMonitoring() external onlyOwner {
        uint256 id = activeScheduleId;
        require(id != 0, "no active schedule");
        SCHEDULER.cancel(id);
        activeScheduleId = 0;
        emit MonitoringCancelled(id);
    }

    // ---- scheduled callback ----

    /// @notice Invoked by the Scheduler. Fetches portfolio value (HTTP), extracts it (JQ),
    ///         and reports it to the vault. The Scheduler overwrites `executionIndex`.
    function runHealthCheck(uint256 executionIndex) external {
        if (msg.sender != address(SCHEDULER)) revert OnlyScheduler();

        // 1) HTTP GET (the single async precompile call for this tx)
        (bool ok, bytes memory raw) = HTTP.call(_encodeGet(valueUrl));
        require(ok, "http precompile call failed");

        // Short-running async envelope: (simmedInput, actualOutput)
        (, bytes memory actualOutput) = abi.decode(raw, (bytes, bytes));
        (
            uint16 statusCode,
            ,
            ,
            bytes memory body,
            string memory errorMessage
        ) = abi.decode(actualOutput, (uint16, string[], string[], bytes, string));
        if (bytes(errorMessage).length != 0) revert HttpFailed(errorMessage);
        if (statusCode != 200) revert HttpStatus(statusCode);

        // 2) JQ extract a uint256 (synchronous precompile — allowed in same tx)
        (bool jqOk, bytes memory jqRes) = JQ.staticcall(
            abi.encode(jqQuery, string(body), uint8(1)) // outputType 1 = uint256
        );
        if (!jqOk || jqRes.length == 0) revert JqFailed();
        uint256 value = abi.decode(jqRes, (uint256));

        // 3) report to the vault (normal call; firewall/breaker logic lives there)
        lastReportedValue = value;
        lastCheckBlock = block.number;
        checkCount++;
        vault.reportPortfolioValue(value);

        emit HealthChecked(executionIndex, value, block.number);
    }

    /// @dev Encodes the 13-field HTTP precompile request for a GET.
    function _encodeGet(string memory url) internal view returns (bytes memory) {
        return abi.encode(
            executor,            // 0: executor
            new bytes[](0),      // 1: encryptedSecrets
            httpTtl,             // 2: ttl
            new bytes[](0),      // 3: secretSignatures
            bytes(""),           // 4: userPublicKey (empty = plaintext)
            url,                 // 5: url
            uint8(1),            // 6: method (1 = GET)
            new string[](0),     // 7: headerKeys
            new string[](0),     // 8: headerValues
            bytes(""),           // 9: body
            uint256(0),          // 10: dkmsKeyIndex (0 = disabled)
            uint8(0),            // 11: dkmsKeyFormat (0 = disabled)
            false                // 12: piiEnabled
        );
    }

    receive() external payable {}
}
