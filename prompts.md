# Claude Code prompts

## Prompt 1 — architecture start

```text
Read CLAUDE.md and all files inside docs/.

Work as a senior engineer in Claude Code.

Start drivedocs as a mobile-first subscription multi-tenant application for ИП and ООО.

First:
1. summarize core product constraints;
2. propose MVP architecture;
3. propose project folder structure;
4. create the minimal project foundation.

Do not implement the full product yet.
```

## Prompt 2 — shell and routes

```text
Using CLAUDE.md, docs/PRD.md and docs/tech-spec.md, create the mobile-first app shell.

Implement:
- app layout
- mobile header
- bottom navigation
- route structure
- placeholder screens for Home, Today, Documents, Trips, Events and Settings

Use TypeScript and keep the UI optimized for 375px width.
```

## Prompt 3 — workspace onboarding

```text
Using docs/data-model.md, docs/user-stories.md and docs/tasks.md, implement:
- workspace selection
- enterprise creation
- onboarding wizard
- steps for legal entity type, tax mode and vehicle usage model

Keep it mobile-first and use plain-language helper text.
```

## Prompt 4 — help layer

```text
Build reusable help-layer components for drivedocs:
- tooltip/info hint
- modal or bottom sheet for explanations
- plain-language guidance block
- skeleton for legal model decision assistant

Follow CLAUDE.md and docs/tech-spec.md.
```

## Prompt 5 — event feed

```text
Using docs/tech-spec.md and docs/data-model.md, build the first mobile event feed with typed mock events and priority grouping.

Support:
- document_missing
- document_expiring
- yearly_document_refresh
- policy_change_notice
- trip_missing_receipt
- fine_created
- fine_status_updated
```
