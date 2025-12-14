# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for LeaderForge LMS.

## What is an ADR?

An Architecture Decision Record captures an important architectural decision along with its context and consequences. ADRs help us:

- Document why decisions were made
- Provide context for future developers
- Track the evolution of the architecture

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](./0001-fresh-start-architecture.md) | Fresh Start with Simplified Architecture | Accepted | Dec 2024 |
| [0002](./0002-theming-strategy.md) | Theming Strategy (Option 2) | Accepted | Dec 2024 |

## Creating New ADRs

1. Copy the template below
2. Name the file `NNNN-short-title.md` (increment the number)
3. Fill in all sections
4. Add to the index above

## ADR Template

```markdown
# ADR-NNNN: Title

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]

## Context
What is the issue that we're seeing that motivates this decision?

## Decision
What is the change we're proposing and/or doing?

## Consequences
What becomes easier or more difficult because of this decision?

### Positive
- List positive outcomes

### Negative
- List negative outcomes or trade-offs

## Alternatives Considered
What other options were evaluated?

## Related Decisions
Links to related ADRs
```

## ADR Lifecycle

1. **Proposed**: Under discussion
2. **Accepted**: Approved and in effect
3. **Deprecated**: No longer recommended
4. **Superseded**: Replaced by a newer ADR

