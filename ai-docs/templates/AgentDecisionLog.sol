// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AgentDecisionLog
/// @notice Minimal on-chain audit trail for an autonomous trading agent.
///         Stores a hash of the user's policy (rules) and emits one event per decision.
///         Full decision payloads stay off-chain (JSON log); only hashes go on-chain.
/// @dev Template, not audited. Deploy to Avalanche Fuji (chainId 43113) with evm_version = "cancun".
contract AgentDecisionLog {
    enum Verdict { Allow, Shrink, Reject }

    address public owner;
    address public agent;            // hot wallet the agent signs with
    bytes32 public policyHash;       // keccak256 of canonical policy.json
    uint256 public decisionCount;

    event PolicySet(bytes32 indexed policyHash, string policyURI, uint256 timestamp);
    event AgentChanged(address indexed agent);
    event Decision(
        uint256 indexed id,
        bytes32 indexed policyHash,
        Verdict verdict,
        string instId,        // e.g. "BTC-USDT"
        bytes32 payloadHash,  // keccak256 of the off-chain decision JSON
        string okxOrderId,    // empty when rejected
        uint256 timestamp
    );

    error NotOwner();
    error NotAgent();

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyAgent() { if (msg.sender != agent && msg.sender != owner) revert NotAgent(); _; }

    constructor(address _agent) {
        owner = msg.sender;
        agent = _agent == address(0) ? msg.sender : _agent;
        emit AgentChanged(agent);
    }

    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
        emit AgentChanged(_agent);
    }

    /// @param _policyHash keccak256 of the policy file the user approved
    /// @param policyURI   optional pointer (IPFS/https/plain text) to the policy
    function setPolicy(bytes32 _policyHash, string calldata policyURI) external onlyOwner {
        policyHash = _policyHash;
        emit PolicySet(_policyHash, policyURI, block.timestamp);
    }

    function logDecision(
        Verdict verdict,
        string calldata instId,
        bytes32 payloadHash,
        string calldata okxOrderId
    ) external onlyAgent returns (uint256 id) {
        id = ++decisionCount;
        emit Decision(id, policyHash, verdict, instId, payloadHash, okxOrderId, block.timestamp);
    }
}
