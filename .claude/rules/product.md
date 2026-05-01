---
description: Product workflow, research providers, MVP scope
globs: ["docs/**"]
alwaysApply: false
---

# Product context

## Workflow
1. Пользователь вводит идею.
2. Выбирает провайдер исследования или импортирует готовое.
3. Приложение генерирует Research Brief → spec pack → архитектуру → первый промпт.
4. Пользователь запускает промпт в Claude Code, вставляет ответ обратно.
5. Приложение извлекает: что проанализировано, реализовано, предложено далее, блокеры.
6. Генерирует следующий промпт. Повторять до готовности продукта.

## Research providers
Провайдер-агностичный нормализованный формат вывода — downstream-модули не зависят от конкретного провайдера:
- Perplexity Deep Research / Pro Search
- Manual research mode
- Imported external research
- Future provider adapters

## MVP scope (строго)
**Строим:** app shell, routing, layouts, idea intake, provider selection UI, research brief workspace, spec workspace, architecture/roadmap workspace, prompt loop workspace, prompt history, result parser, mock/in-memory state.

**НЕ строим пока:** production backend, real provider integrations, billing, auth, collaboration, document export, advanced prompt optimization, multi-user workflow.
