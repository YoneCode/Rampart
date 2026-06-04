// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @notice Deterministic policy parameters enforced on-chain by the Rampart firewall.
struct Policy {
    uint256 maxTxValueWei;    // max native value per single action
    uint256 maxDailySpendWei; // rolling 24h native spend cap
    uint16  maxSlippageBps;   // max declared slippage (basis points; 1e4 = 100%)
    uint16  drawdownLimitBps; // circuit-breaker threshold vs high-water mark
    uint64  defaultTtl;       // informational: default seconds a proposal stays valid
}

/// @notice A consequential action proposed by an agent and gated by the firewall.
struct ActionRequest {
    uint256 nonce;       // replay protection (must equal the vault's expectedNonce)
    address target;      // protocol/contract to call (must be allowlisted)
    uint256 value;       // native value to send with the call
    bytes   callData;    // calldata to execute on `target`
    address tokenIn;     // token being spent (address(0) = native only)
    uint256 amountIn;    // amount of tokenIn (informational + token policy)
    uint16  slippageBps; // declared slippage for this action
    uint64  deadline;    // unix time after which the action is invalid (0 = no deadline)
}

/// @notice Firewall evaluation outcome. ALLOW == 0; everything else is a deny reason.
enum DecisionCode {
    ALLOW,
    DENY_PAUSED,
    DENY_BAD_NONCE,
    DENY_EXPIRED,
    DENY_VALUE_LIMIT,
    DENY_DAILY_LIMIT,
    DENY_TARGET_NOT_ALLOWED,
    DENY_TOKEN_NOT_ALLOWED,
    DENY_SLIPPAGE
}
