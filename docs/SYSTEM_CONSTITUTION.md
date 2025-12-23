# System Constitution

## Immutable Principles

This document defines the constitutional principles that govern the trading system. These principles are **non-negotiable** and cannot be bypassed by operators, AI, configuration, or code changes.

### 1. PRIMARY OBJECTIVE

- The system exists to generate money over time while preserving survivability.
- Capital must be protected above all else.
- No existential risk (total wipeout, liquidation, or single-point-of-failure exposure) is ever allowed.

### 2. AUTHORITY MODEL (HYBRID)

- The system evaluates, advises, and warns.
- The human operator is the final signatory on execution decisions.
- All operator overrides must be explicit, logged, explainable, and auditable.
- No override may bypass hard risk constraints.

### 3. HARD CONSTRAINTS (NON-OVERRIDABLE)

The following rules are constitutional and cannot be bypassed by humans, AI, configuration, or code changes:

- **Capital caps** - Maximum capital deployment limits
- **Maximum loss thresholds** - Hard limits on drawdown and daily loss
- **Liquidation prevention** - Protections against total capital loss
- **Confidence gate requirements** - Validation requirements before real capital deployment
- **Validation requirements** - Evidence requirements (500+ shadow trades, 100+ runtime days, 90+ confidence score)

### 4. EVIDENCE-FIRST EXECUTION

- No action touching real capital is allowed without replayable, auditable evidence.
- Unverifiable performance is unacceptable.
- All decisions must be explainable post-hoc using logs, events, and metrics.

### 5. AI ROLE

- AI may suggest, monitor, explain, and learn.
- AI may not silently execute, bypass safeguards, or escalate authority.
- AI enforces discipline, not greed.

### 6. FAILURE PHILOSOPHY

- Failure is expected and must be survivable.
- The system must degrade gracefully.
- Recovery paths are first-class citizens, not edge cases.

### 7. TIME HORIZON

- This system is designed to be trusted for 5+ years.
- Short-term gains never justify long-term fragility.

### 8. UI PHILOSOPHY

- Interfaces are observational, not operational, unless explicitly authorized.
- Visibility never implies control.

## Implementation Principles

When implementing code, architecture, or UI:

- Prefer boring correctness over clever fragility.
- Prefer explicitness over convenience.
- Prefer constraints over optional discipline.

If a proposed change violates any principle above, it must be rejected.
