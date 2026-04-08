# drivedocs

drivedocs is a mobile-first, subscription-based web application for ИП and ООО using personal vehicles for business purposes.

**drivedocs is NOT a website builder or app constructor.** It is a purpose-built tool for trip logging, document management, workspace configuration, and vehicle-related event tracking for Russian business entities.

The app helps users:
- configure the correct legal model for using a personal vehicle in business;
- manage enterprise-specific document workflows (one-time and recurring);
- track trips and expenses;
- receive reminders and view vehicle-related events including fines.

---

## Start here

1. Read `CLAUDE.md` — product identity, governance rules, AI assistant instructions
2. Read `docs/PRD.md` — what and why
3. Read files in `docs/` — full spec, features, tasks, decisions
4. Follow the governance cycle before writing code

---

## Workflow

All changes — features, fixes, architecture decisions — follow this cycle:

```
Brainstorm → Spec → Plan → Tasks → Code (+ tests) → Review
```

- **Source of truth** lives in `docs/` and `CLAUDE.md`.
- Code is not written before a plan exists.
- Every feature is traceable via IDs: `F-xxx`, `US-xxx`, `T-xxx`, `D-xxx`.
- Architecture changes are reflected in `docs/tech-spec.md` or `docs/decisions.md` before the code changes.

See `docs/superpowers-workflow.md` for the full description of each phase and gate criteria.

---

## Docs overview

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI assistant instructions, governance rules, product identity |
| `docs/PRD.md` | Problem, goals, success criteria, non-goals, MVP scope |
| `docs/features.md` | Feature registry — F-xxx IDs, status, linked stories and tasks |
| `docs/user-stories.md` | US-xxx stories with acceptance criteria and feature/task links |
| `docs/tech-spec.md` | Architecture, main flows, constraints, trade-offs, open questions |
| `docs/data-model.md` | Domain entities, fields, relations, which features use each entity |
| `docs/plan.md` | Implementation plan: phases, high-level steps, T-xxx task list |
| `docs/tasks.md` | T-xxx task registry: type, status, owner, acceptance notes |
| `docs/decisions.md` | D-xxx decision log (ADR-lite): context, options, choice, consequences |
| `docs/superpowers-workflow.md` | Governance cycle phases and gate criteria |
| `docs/testing-strategy.md` | Test levels, acceptance checks, when to test |
