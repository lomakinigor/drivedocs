# CLAUDE.md

## Project identity
Product name: AI Product Studio

AI Product Studio is a spec-driven tool that helps a user turn a raw product idea into a built application or website.
It guides the user through:
1. researched idea brief,
2. structured implementation specification,
3. architecture and phased roadmap,
4. iterative prompts for Claude Code,
5. a managed build loop where each Claude response becomes input for the next prompt.

AI Product Studio enforces the same development cycle for its own construction as it enforces for the applications and websites users build with it.

## Core principle
Do not try to build the full product at once.
Always work in small, auditable steps.
One prompt = one task.
First analyze, then plan, then implement.
Prefer safe MVP choices when requirements are ambiguous.

## Superpowers cycle
Every project — including AI Product Studio itself — follows this cycle:

Brainstorm → Spec → Plan → Tasks → Code (+Tests) → Review

Rules that govern this cycle:
1. No code is written before a plan exists and at least one test task is defined for the work.
2. Every human or AI action must be grounded in a document in `docs/*`.
3. Every implementation change should reference the relevant feature ID (F-xxx) and task ID (T-xxx) where applicable.
4. Review means checking the output against the original spec and test criteria — not just that the code runs.

This cycle applies at two levels:
- **Meta level:** how AI Product Studio itself is planned, built, and iterated.
- **User level:** how users build their own applications and websites through AI Product Studio.

## Product workflow
The intended product flow is:
1. User enters a raw idea.
2. User selects a research mode/provider or imports previously completed research.
3. App produces a normalized Research Brief.
4. App generates a structured spec pack.
5. App generates architecture and phased roadmap.
6. App generates the first Claude Code prompt.
7. User runs the prompt in Claude Code.
8. User pastes Claude's response back into the app.
9. App extracts:
   - what was analyzed,
   - what was implemented,
   - what is proposed next,
   - warnings / blockers.
10. App generates the next prompt.
11. Repeat until the product is built.

## Research providers
The application must be designed so research can come from different providers:
- Perplexity Deep Research
- Perplexity Pro Search
- Manual research mode
- Imported external research
- Future provider adapters

Use a provider-agnostic normalized output format so downstream modules do not depend on one vendor or one source format.

## MVP boundaries
For MVP, build only:
- app shell
- routing
- core layouts
- idea intake
- research provider selection UI
- imported research input flow
- research brief workspace
- spec generation workspace
- architecture/roadmap workspace
- prompt loop workspace
- prompt history
- result parser for structured Claude responses
- local mock data / in-memory state

Do NOT build yet:
- production backend
- real external provider integrations
- billing
- authentication
- collaboration
- full document export engine
- advanced prompt optimization
- full multi-user workflow

## UX principles
- Mobile-first and desktop-usable
- Clear linear workflow
- Low cognitive load
- Strong progress visibility
- Every AI step should show input, output, and next action
- User should always understand "where they are" in the build pipeline
- Imported and generated research should look consistent after normalization

## Technical principles
- TypeScript with strict typing
- Clear module boundaries
- Separate domain logic from UI
- Keep provider integrations behind interfaces/adapters
- Prefer explicit typed domain models over ad hoc JSON blobs
- Use mock repositories/services first, then replace with real implementations

## Implementation rules
Before coding:
1. Read `docs/PRD.md`
2. Read `docs/features.md`
3. Read `docs/plan.md`
4. Read `docs/tech-spec.md`
5. Read `docs/data-model.md`
6. Read `docs/user-stories.md`
7. Read `docs/tasks.md`
8. Read `docs/directory-structure.md`

For each implementation task:
1. Briefly analyze constraints.
2. Propose a short plan — do not write code until this step is confirmed.
3. List files to create/change.
4. Confirm at least one test task or acceptance criterion exists before writing code.
5. Implement only the requested scope.
6. Explain what was done, referencing F-xxx feature IDs and T-xxx task IDs where applicable.
7. Propose the next best step.

Every implementation comment, commit message, or explanation that touches a defined feature or task must include the relevant ID (e.g. "implements F-003 / T-007").

## Required response format
Always answer in this format:

1. Brief analysis
2. Implementation plan
3. Files created/changed
4. Implementation
5. What is recommended next

## Architecture preference
Prefer a frontend-first architecture for MVP.
Use mock services and adapters for research providers, imported research normalization, and prompt generation.
Design the system so the orchestration logic can later move to a backend without rewriting the UI.

## Safety
When something is unclear:
- choose the smallest safe MVP approach,
- document assumptions,
- do not invent hidden complex infrastructure unless explicitly needed.

## Язык интерфейса и контента (КРИТИЧЕСКИ ВАЖНО)

Всё, что видит пользователь продукта (в т.ч. drivedocs), должно быть на русском языке.

Обязательные правила:
- Все UI‑тексты, подписи, подсказки, сообщения об ошибках, empty states, статусы, названия экранов и разделов — на русском.
- Все документы, отчёты, PDF, экспортируемые тексты и описания полей — на русском.
- Все события, уведомления, attention items, подсказки в онбординге, paywall‑копирайтинг и billing‑сообщения — на русском.

Допустимые исключения:
- Аббревиатуры и общепринятые сокращения: ИП, ООО, ИНН, ОГРНИП, VIN, PDF, API, RLS, OCR, ID и т.п.
- Названия технологий, библиотек, брендов и платёжных систем: Supabase, Stripe, PostgreSQL, TypeScript и т.п.
- Специальные символы, коды, идентификаторы, регистрационные знаки, номера документов, e‑mail, URL.
- Юридически или технически обязательные обозначения, которые нецелесообразно переводить.

Если внешняя система возвращает англоязычное сообщение (например, Supabase или Stripe):
- не показывать его напрямую пользователю;
- отобразить понятный русский текст, а оригинальное сообщение использовать только для логов/отладки.

Проверка перед завершением любой задачи:
- нет ли новых строк на английском в UI;
- нет ли англоязычных текстов в документах/отчётах;
- все новые user‑facing строки соответствуют этим правилам.

## Специфика drivedocs / AI Product Studio

Этот репозиторий сам собирается по тем же правилам, которые AI Product Studio навязывает пользователю:

- Любое изменение начинается с docs (`PRD`, `features`, `user-stories`, `tech-spec`, `data-model`, `plan`, `tasks`, `decisions`).
- Любой prompt для Claude Code должен ссылаться на актуальные docs как на единственный источник правды.
- Любая фича, user story или задача должна иметь ID: `F-xxx`, `US-xxx`, `T-xxx`, `D-xxx`.
- Любая реализация и review обязаны явно указывать, какие ID они реализуют/проверяют.

Дополнительные правила для drivedocs:

1. **Фронтенд вперёд.**  
   Сначала mobile‑first UX и сторы состояния (Zustand, React), потом — интеграции с backend и платежами.

2. **Backend only when ready.**  
   Сначала: mock/state-only → затем Supabase schema + RLS → затем auth → затем billing/reminders.

3. **Локализация.**  
   drivedocs — русскоязычный продукт. Все новые строки по умолчанию должны быть на русском (см. раздел «Язык интерфейса» выше).

4. **Traceability по умолчанию.**  
   Любой ответ Claude Code должен в конце явно перечислять:
   - какие `F-xxx` / `US-xxx` / `T-xxx` / `D-xxx` были затронуты;
   - какие docs обновлены;
   - какие ограничения/assumptions зафиксированы.

5. **Никаких «скрытых» изменений.**  
   Всё, что влияет на поведение приложения или архитектуру, должно быть:
   - отражено в docs;
   - привязано к ID;
   - описано в summary ответа.

## Память – КРИТИЧЕСКИ ВАЖНО

Без памяти ты бесполезен. Каждая сессия без записей = потерянный контекст.

### Хранилище

- `MEMORY.md` – долгосрочная память (факты, проекты, предпочтения, решения).
- `memory/YYYY-MM-DD.md` – дневник дня (задачи, прогресс, решения).
- `knowledge/` – база знаний (архитектура, баги, чеклисты, повторяемые решения).

### При старте КАЖДОЙ сессии – ОБЯЗАТЕЛЬНО

1. Прочитай `MEMORY.md`.
2. Прочитай файлы `memory/` за последние 3 дня.
3. Если файла `memory/YYYY-MM-DD.md` ещё нет сегодня – создай его и запиши:
   - дату;
   - время старта;
   - тему сессии.
4. Если папок `memory/` или `knowledge/` не существует – создай их.

### Во время работы – ОБЯЗАТЕЛЬНО

- Каждые ~5 сообщений дописывай краткий итог в `memory/YYYY-MM-DD.md`.
- Новый постоянный факт (проект, предпочтение, решение) – сразу в `MEMORY.md`.
- Моя правка/коррекция – сохрани в `memory/feedback_ТЕМА.md`.
- Один и тот же вопрос 2+ раза – сохрани ответ в `knowledge/` (отдельный файл по теме).
- После создания или правки любого файла в репо – запиши об этом в дневник дня.

### Перед завершением сессии

- Допиши в `memory/YYYY-MM-DD.md` итог:
  - что сделали;
  - что осталось;
  - ключевые решения.
- Если узнал новые важные факты – обнови `MEMORY.md`.

### Формат дневника (memory/YYYY-MM-DD.md)

```md
# YYYY-MM-DD

## Сессия 1 (HH:MM)
Тема: ...

### Сделано
- ...

### Решения
- ...

### TODO на потом
- ...
```

### Правила для MEMORY.md

- Максимум 200 строк. Если больше – удали устаревшее, объедини дубли.
- Рекомендуемая структура:
  - Клиент
  - Проекты
  - Стек
  - Предпочтения
  - Ссылки

### Содержимое knowledge/

- Архитектура проектов.
- Решения багов, которые могут повториться.
- Чеклисты и инструкции, которые выгодно переиспользовать.

### Самопроверка

Если ты провёл 10+ сообщений и НЕ записал ничего в `memory/` – ты нарушил правила.
Остановись и запиши краткий итог прямо сейчас.
