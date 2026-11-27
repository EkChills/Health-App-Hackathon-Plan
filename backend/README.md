# BST backend

**Not built yet.** The stack for this folder has not been chosen. The endpoints it must serve are in `API.md` at the repo root.

## What is here

| Path | What it is |
| --- | --- |
| `rules/index.ts` | A stub of the rules engine's types and its `evaluate` function. It is a sketch of the interface, not working code. |

The stub is TypeScript because the skeleton started as one Next.js app. If the backend ends up in another language, port the types and keep the rule below.

## The one rule that does not change

The rules engine makes every clinical judgement: ranges, interactions, urgency. **It contains zero model calls**, and it must be testable with plain fixtures. See `PLAN.md` §4 and the appendix.
