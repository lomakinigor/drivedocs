---
description: UX и технические принципы для фронтенд-файлов
globs: ["src/**/*.tsx", "src/**/*.ts", "src/**/*.css"]
alwaysApply: false
---

# Frontend

## UX принципы
- Mobile-first, desktop-usable
- Чёткий линейный workflow, низкая когнитивная нагрузка
- Видимый прогресс на каждом шаге
- Каждый AI-шаг показывает: вход → выход → следующее действие
- Пользователь всегда понимает где находится в pipeline
- Импортированные и сгенерированные данные выглядят одинаково после нормализации

## Технические принципы
- TypeScript с strict typing
- Чёткие границы модулей, domain logic отделена от UI
- Provider integrations — за interfaces/adapters
- Typed domain models вместо ad hoc JSON
- Сначала mock repositories/services, потом реальные реализации
- Для архитектуры MVP: frontend-first, mock adapters, логика оркестрации может позже переехать на backend без переписывания UI
