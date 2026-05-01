# CLAUDE.md

## Project identity
**AI Product Studio** — spec-driven инструмент для превращения сырой идеи в работающее приложение или сайт. Проводит пользователя через: research brief → spec → архитектура → промпты для Claude Code → управляемый build loop.

Репозиторий строится по тем же правилам, что AI Product Studio навязывает пользователям.

## Core principle
Не пытаться построить всё сразу. Малые, проверяемые шаги. Один промпт = одна задача. Сначала анализ, потом план, потом код. При неопределённости — безопасный MVP.

## Superpowers cycle
Brainstorm → Spec → Plan → Tasks → Code (+Tests) → Review

1. Код пишется только после плана и хотя бы одного test-задания.
2. Любое действие опирается на документ в `docs/*`.
3. Любое изменение ссылается на F-xxx / T-xxx где применимо.
4. Review = проверка против spec и критериев, не просто «работает».

**Стратегия моделей (opusplan):**
- Brainstorm и Spec — Opus (архитектурные решения, дискавери).
- Tasks и Code — Sonnet (реализация по плану).
- Routine (форматирование, переименования) — Haiku.
Переключать модель явно перед сменой стадии.

## Правило двух коррекций
Если одна и та же проблема объясняется второй раз без улучшения — НЕ повторять третью попытку. Варианты:
1. Вызвать `/council` — три эксперта дадут альтернативные углы.
2. Сделать `/clear` и переформулировать промпт с фокусом на верификацию (не «сделай X», а «проверь, что X действительно работает с Y»).
Первопричина повторов — недостаток верификации, а не недостаток инструкций.

## Required response format
1. Brief analysis
2. Implementation plan
3. Files created/changed
4. Implementation
5. What is recommended next

## Safety
При неопределённости: минимальный безопасный MVP, задокументировать assumptions, не изобретать скрытую инфраструктуру.

## Rules
Детальные правила загружаются из `.claude/rules/`:
- `russian.md` — язык интерфейса (always)
- `memory.md` — протокол памяти и compact (always)
- `implementation.md` — docs, ID-система, traceability (always)
- `frontend.md` — UX и tech принципы (src/**)
- `product.md` — workflow, providers, MVP scope (docs/**)
