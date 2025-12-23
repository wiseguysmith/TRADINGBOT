# Operator Override Framework

## Intent

The human operator is the final decision-maker but not above the system constitution.

Operator overrides are permitted ONLY under the following rules:

## 1. OVERRIDE CONDITIONS

- The system must present a clear recommendation and risk assessment.
- The operator must explicitly acknowledge:
  - The system's recommendation
  - The associated risks
  - The reason for overriding

## 2. OVERRIDE LOGGING

- All overrides must generate an immutable event:
  - Timestamp
  - Operator identity
  - System recommendation
  - Operator rationale
  - Risk metrics at decision time

## 3. NON-OVERRIDABLE RULES

The operator may NEVER override:

- **Capital caps** - Maximum capital deployment limits
- **Max loss limits** - Hard limits on drawdown and daily loss
- **Liquidation prevention** - Protections against total capital loss
- **Confidence gate blocks** - Validation requirements before real capital deployment
- **Validation requirements** - Evidence requirements (500+ shadow trades, 100+ runtime days, 90+ confidence score)

## 4. COOLDOWN & FRICTION

- Overrides should introduce intentional friction (confirmation steps).
- No "one-click" overrides are permitted.

## 5. ACCOUNTABILITY

- Overrides are visible in operator dashboards.
- Overrides are included in post-hoc analysis.
- Overrides are treated as first-class events, not exceptions.

## Implementation Status

**Current Status**: Framework defined at principle level. Implementation deferred until post-validation.

**Rationale**: 
- Validation phase requires evidence-first discipline
- Overrides introduce risk and temptation during validation
- Framework will be implemented after validation requirements are met

The operator has authority — but also accountability.
