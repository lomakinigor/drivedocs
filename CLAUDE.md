# CLAUDE.md

## Product identity — READ THIS FIRST

**Project:** drivedocs
**Type:** mobile-first subscription web app
**Primary users:** ИП и ООО, использующие личный автомобиль в служебных целях
**Main interface priority:** smartphone first

**ЗАПРЕЩЕНО менять назначение продукта.**
drivedocs — это приложение для учёта поездок, документов, событий и настройки рабочих пространств для ИП/ООО, которые используют личный автомобиль в служебных целях.
Любые случайные формулировки из другого проекта (например, "создание приложений", "конструктор сайтов" и т.п.) считаются невалидными и должны игнорироваться или удаляться.

---

## Product goals

Build a mobile-first, low-friction product that helps users:
- choose the correct legal model for using a personal vehicle in business;
- configure a separate workspace for each enterprise;
- collect one-time and recurring documents;
- manage daily trips, receipts and expenses;
- receive reminders, guidance and vehicle-related events, including fines.

## Scope rules

MVP supports only:
- ИП
- ООО

Do not implement a full self-employed (самозанятый) flow.

## Core product constraints

- One account may contain multiple enterprise workspaces.
- Each workspace has separate legal and tax configuration.
- The app is subscription-based.
- UX must prioritize convenience over density.
- The main user works from a phone, often in short sessions.
- Legal complexity must be translated into plain-language guidance.
- Large forms must be split into guided steps.
- Use reminders, event feeds, dialogs and contextual help instead of heavy documentation screens.

---

## Governance cycle

Every significant change follows this cycle:

```
Brainstorm → Spec → Plan → Tasks → Code (+ tests) → Review
```

See `docs/superpowers-workflow.md` for the full description of each phase.

**Rules for the AI assistant:**
1. Do not write code before there is a plan. For small fixes (1–3 lines) a plan can be stated inline. For features, update `docs/plan.md` first.
2. Before starting an impl task, identify at least one acceptance criterion or assertion. Reference it from the task.
3. After implementing a feature, update the relevant docs: features.md, tasks.md, decisions.md if a new choice was made.
4. Always reference IDs when discussing work: Feature IDs (`F-xxx`), User Story IDs (`US-xxx`), Task IDs (`T-xxx`), Decision IDs (`D-xxx`).
5. Do not change architecture silently. Any architectural change must be reflected in `docs/tech-spec.md` or `docs/decisions.md` first, then in code.
6. If in doubt about product scope, re-read `docs/PRD.md`. Do not add features that are outside the MVP boundary.

---

## Documentation map

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI assistant instructions, governance rules, product identity |
| `docs/PRD.md` | What and why: problem, goals, success criteria, non-goals, MVP scope |
| `docs/features.md` | Feature registry with F-xxx IDs, status, linked stories and tasks |
| `docs/user-stories.md` | US-xxx user stories with acceptance criteria and feature/task links |
| `docs/tech-spec.md` | Architecture, main flows, constraints, trade-offs, open questions |
| `docs/data-model.md` | Domain entities, fields, relations, which features use each entity |
| `docs/plan.md` | Implementation plan: phases, high-level steps, task list |
| `docs/tasks.md` | T-xxx task registry: type, status, owner, acceptance notes |
| `docs/decisions.md` | D-xxx decision log (ADR-lite): context, options, choice, consequences |
| `docs/superpowers-workflow.md` | Governance cycle phases and gate criteria |
| `docs/testing-strategy.md` | Test levels, when to test, acceptance checks as tests |

---

## Engineering principles

- Use TypeScript with strict typing.
- Prefer simple, maintainable architecture.
- Build the app incrementally.
- Do not attempt the full product in one step.
- Keep business rules isolated from UI components.
- Keep workspace scoping explicit in data and routes.
- Use reusable typed domain models.
- Separate shell, features, entities and shared UI.

## UX principles

- Mobile-first at every step.
- One primary action per screen.
- Keep forms short and progressive.
- Use bottom navigation on mobile.
- Prefer bottom sheets and dialogs for contextual actions.
- Explain legal terms in simple words.
- Use empty states to guide the next action.
- Always show status, next step and urgency clearly.

---

## Delivery rules

When asked to implement a feature:
1. State the task briefly and reference the relevant F-xxx / T-xxx IDs.
2. Identify affected files.
3. Propose the smallest safe implementation plan.
4. Implement incrementally.
5. Update docs (features.md status, tasks.md status, decisions.md if needed).
6. Summarize what was created and what remains.

## Mandatory reading before coding

Always read these files before making architectural or product decisions:
- `docs/PRD.md`
- `docs/tech-spec.md`
- `docs/data-model.md`
- `docs/features.md`
- `docs/user-stories.md`
- `docs/tasks.md`
- `docs/plan.md`
- `docs/decisions.md` (when available — check before any architectural change)


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
