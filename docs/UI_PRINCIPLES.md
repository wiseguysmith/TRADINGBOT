# UI Principles

## Core Philosophy

The operator interface is an **instrument panel, not a control cockpit**.

The UI exists to **INFORM decisions, not to tempt them**.

## 1. READ-ONLY BY DEFAULT

- **No execution controls during validation**
- **No hidden actions**
- **Visibility does not imply authority**

During validation phase, all operator interfaces are strictly read-only. No buttons, forms, or interactions that could trigger execution, modify configuration, or bypass governance.

## 2. CLARITY OVER COMPLEXITY

- **Non-technical language wherever possible**
- **Timelines over tables**
- **Graphs over raw numbers when meaning matters**

The UI should be understandable by a beginner trader. Technical jargon should be avoided or explained. Visual representations (timelines, graphs) should be preferred over dense tables when they convey meaning more clearly.

## 3. TRUTHFULNESS

- **Show uncertainty explicitly**
- **Show confidence levels**
- **Show what the system does NOT know**

The UI must never hide uncertainty or present false confidence. Confidence scores, uncertainty ranges, and knowledge gaps should be visible and clearly labeled.

## 4. ACCOUNTABILITY SIGNALING

- **Highlight warnings**
- **Surface overrides**
- **Make risk visible, not buried**

Risk indicators, warnings, and operator overrides (when implemented) must be prominently displayed, not hidden in menus or footnotes. Accountability requires visibility.

## 5. EMOTIONAL POSTURE

The UI should produce:

- **Confidence** - System is under control
- **Urgency** - Without panic
- **Accountability** - Actions have consequences

The interface should communicate that the system is well-governed and disciplined, while making it clear that decisions matter and have consequences.

## 6. BEGINNER-READABLE

A beginner trader should be able to answer:

- **What is happening?** - Current system state, active trades, mode
- **Why is it happening?** - Explanations, attribution, reasoning
- **What is allowed?** - Current permissions, constraints, gates
- **What is blocked?** - Why trades are blocked, what requirements are missing

## Constraints

**No UI element may:**

- Encourage impulsive action
- Hide risk
- Soften constraints
- Bypass governance

## Implementation Status

**Current Status**: Principles defined. Existing operator pages under review for alignment.

**Validation Phase**: All operator interfaces are read-only. No execution controls permitted.
