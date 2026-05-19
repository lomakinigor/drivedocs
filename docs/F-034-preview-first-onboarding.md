# F-034 · Preview-first onboarding + progressive setup

**Статус:** spec
**Автор:** drivedocs team
**Дата:** 2026-05-18
**Зависимости:** F-026 (essentials), F-031 (document ack), F-032 (waybill templates), F-029 (field memory)

---

## 1. Проблема

Текущий onboarding wizard — 6 шагов с обязательными полями (тип / название / ИНН / налоговый режим / схема ТС / summary). После завершения пользователь попадает на Home, где его ждёт ещё 3 обязательных блока essentials (организация / авто / водитель) и модалка auto-open `EssentialsSheet`. TTV до первого ценного действия — 3–5 минут.

Это критичный барьер для intent-driven ЦА (ИП и ООО малого бизнеса). Конкуренты (МойСклад, Контур.Эльба, Тинькофф Бизнес) достигают TTV в 30–60 секунд за счёт минимального onboarding и progressive disclosure.

UX-исследования и обоснование решения — `knowledge/onboarding-decision.md` (см. также Perplexity-рекомендацию и обсуждение 2026-05-18).

## 2. Цели

1. Сократить wizard до **1 экрана с 1 чек-боксом и 1 опциональным полем**.
2. Дать пользователю **сразу** доступ ко всему UI приложения после прохождения этого экрана.
3. Перенести сбор обязательных данных (ИНН, авто, водитель) в **inline-блоки на Home**, без auto-open модалок.
4. Реализовать **just-in-time enforcement**: при тапе «Скачать путевой PDF» при отсутствии essentials — подсветка нужных блоков на Home (не блокирующая модалка).
5. Сохранять **wizard state в localStorage** — если пользователь закрыл, возобновляется с того же места.
6. Разнести роли: **Settings — это management, не повторный onboarding**.

## 3. Out of scope (P2)

- Sandbox preview mode с демо-данными — оставляем на потом, если SEO-трафик окажется значимым.
- Авто-определение ИНН по ФИО через ЕГРЮЛ-API — link на egrul.nalog.ru достаточно.
- Расширенная аналитика wizard-step drop-off — базовая метрика `wizard.step.{n}` фиксируется, дашборд — позже.

## 4. UX-спецификация

### 4.1 Phase 1 — wizard (1 экран, ~8 секунд)

```
┌─────────────────────────────────────────┐
│   ←       ●○ (1 из 1)                   │
├─────────────────────────────────────────┤
│                                          │
│   ВАШ БИЗНЕС                            │
│                                          │
│   Кто вы?                                │
│                                          │
│   ┌──────────┐   ┌──────────┐           │
│   │   ИП     │   │   ООО    │           │
│   │ инд.     │   │ юр.лицо  │           │
│   │ предпр.  │   │          │           │
│   └──────────┘   └──────────┘           │
│                                          │
│   Название (необязательно)               │
│   ┌─────────────────────────────────┐   │
│   │ ИП Пупкин                       │   │   ← placeholder
│   └─────────────────────────────────┘   │
│   Можно заполнить позже на главной       │
│                                          │
│                                          │
├─────────────────────────────────────────┤
│  [ Готово, начать работу →           ]  │
└─────────────────────────────────────────┘
```

**Поля:**
- `entityType` — обязательно (тап). После выбора снизу появляется поле «Название».
- `workspaceName` — **опционально**. Placeholder зависит от выбранного типа:
  - Для ИП: `ИП Пупкин`
  - Для ООО: `ООО «Рога и копыта»`

**Default'ы, устанавливаются автоматически без UI:**
- `taxMode = 'USN_INCOME_MINUS_EXPENSES'` (УСН 15%)
- `vehicleUsageModel = 'COMPENSATION'` (для ИП — компенсация за личное авто)
- Если `workspaceName` пуст: для ИП = «ИП», для ООО = «Моя организация» (placeholder в UI до заполнения)

**Acceptance:**
- Тап `entityType` + тап «Готово» = переход на Home за 2 действия.
- Прерванный wizard сохраняется в `localStorage['drivedocs:wizard-draft']` и восстанавливается при следующем открытии.

### 4.2 Phase 2 — Home essentials (inline, по мере готовности)

После Phase 1 пользователь попадает на Home. Сверху видит баннер essentials с тремя блоками:

```
┌─ Чтобы выпускать путевой лист — 3 блока ───────────┐
│                                                      │
│  1. Реквизиты организации          [Заполнить →]    │
│     Название, ИНН (12 цифр для ИП / 10 для ООО)     │
│                                                      │
│  2. Автомобиль                     [Заполнить →]    │
│     Марка, модель, госномер                          │
│                                                      │
│  3. Водитель                       [Заполнить →]    │
│     ФИО                                              │
│                                                      │
│  Без этих данных путевой лист недействителен.        │
└──────────────────────────────────────────────────────┘
```

Каждый блок раскрывается inline (без перехода на отдельный экран):

```
┌─ 1. Реквизиты организации ──────────────────┐
│  Название [ИП Пупкин___________________]    │
│  ИНН      [____________________________]    │
│  ИНН физлица — 12 цифр. Есть в паспорте      │
│  или на сайте ФНС. Не помните?               │
│  → Найти по ФИО на egrul.nalog.ru            │
│                                              │
│  [ Сохранить ]                               │
└──────────────────────────────────────────────┘
```

**Изменения относительно текущего поведения:**
- Auto-open `EssentialsSheet` **убрано**.
- Каждый блок — inline-форма на Home, не отдельный sheet.
- Для блока ИНН — кнопка-ссылка «Не помню» → `https://egrul.nalog.ru/` (в новой вкладке).
- Прогресс «0/3 → 3/3» виден в заголовке баннера.

### 4.3 Phase 3 — JIT enforcement

Когда пользователь жмёт **«Путевой лист за сегодня»** или **«Скачать путевой PDF»** при незаполненных essentials:

- НЕ показывать блокирующую модалку с большой формой.
- Показать **toast / banner**: «Чтобы выпустить путевой, заполните: ИНН, автомобиль, водитель».
- Кнопка toast'а: «Перейти к заполнению» → scroll на Home к essentials-баннеру, подсветка незаполненных блоков (3 секунды border-pulse).
- Если все 3 блока заполнены — PDF генерируется как обычно.

### 4.4 Settings — management only

После реализации F-034:
- **Удалить** из Settings дубли полей wizard'а (тип / название если они есть как редактируемые).
- **Оставить** для management:
  - Налоговый режим (с пометкой «Сейчас: УСН 15% — изменить?»)
  - Схема использования ТС (с пометкой «Сейчас: Компенсация — изменить?»)
  - Расширенные реквизиты (КПП, ОГРН, банк, юр. адрес, телефон)
  - Авто и водитель — те же inline-формы что и на Home
  - Reset/reconfigure actions

## 5. Технические изменения

### 5.1 OnboardingWizard

**Файл:** [src/features/onboarding/OnboardingWizard.tsx](drivedocs-app/src/features/onboarding/OnboardingWizard.tsx)

- Удалить шаги `inn`, `tax_mode`, `vehicle_model`, `summary`.
- Оставить шаг `entity_type` с одним подэкраном, где сразу появляется поле `workspaceName`.
- `STEP_ORDER` → `['entity_type', 'complete']` или вообще один шаг.
- `canProceed('entity_type')` = `!!state.entityType` (название опционально).
- В `handleComplete` применить default'ы для `taxMode` и `vehicleUsageModel`.
- Если `workspaceName.trim() === ''` — использовать default по типу.

### 5.2 Wizard state persistence

**Новый файл:** `src/lib/onboarding/wizardDraft.ts`

```ts
const KEY = 'drivedocs:wizard-draft:v1'

export interface WizardDraft {
  entityType?: 'IP' | 'OOO'
  workspaceName: string
  updatedAt: string
}

export function readDraft(): WizardDraft | null
export function writeDraft(draft: WizardDraft): void
export function clearDraft(): void
```

Восстанавливать draft при mount'е OnboardingWizard. Очищать после `handleComplete`.

### 5.3 EssentialsReminder → EssentialsBlock (inline)

**Файл:** [src/features/home/EssentialsReminder.tsx](drivedocs-app/src/features/home/EssentialsReminder.tsx)

- Переименовать в `EssentialsBlocks` или `EssentialsPanel`.
- Удалить open-trigger для `EssentialsSheet`.
- Заменить на inline-forms прямо на Home.
- Каждый блок — отдельный collapsible с inline-формой.

**Файл:** [src/features/home/useEssentialsStatus.ts](drivedocs-app/src/features/home/useEssentialsStatus.ts)

- `hasOrg` теперь должен проверять `inn` (не только `organizationName`/`ownerFullName`).
- `hasVehicle`, `hasDriver` — без изменений.

### 5.4 HomePage

**Файл:** [src/pages/HomePage.tsx](drivedocs-app/src/pages/HomePage.tsx)

- **Удалить** auto-open `EssentialsSheet` (`useEffect` с `SESSION_ESSENTIALS_SHOWN`).
- Заменить компактный `EssentialsReminderCard` на полноценный `EssentialsBlocks` (раскрытые карточки сверху Home, если `!complete`).
- Добавить ref + scroll-to-target для JIT-enforcement.

### 5.5 WaybillPreviewSheet / WaybillRequiredAction

**Файл:** [src/features/trips/WaybillPreviewSheet.tsx](drivedocs-app/src/features/trips/WaybillPreviewSheet.tsx)

- Не открывать sheet вообще, если essentials не complete.
- Вместо этого вызывать `onMissingEssentials()` callback из родителя.
- Родитель (HomePage / TodayPage) обрабатывает: показывает toast + scroll к essentials-блокам.

**Альтернатива (проще):** сохранить открытие sheet'а, но внутри показывать большой warning + кнопку «Перейти к заполнению» вместо `data.warnings` списка.

### 5.6 SettingsPage — чистка

**Файл:** [src/pages/SettingsPage.tsx](drivedocs-app/src/pages/SettingsPage.tsx)

- Аудит секций: убрать всё что дублирует wizard.
- Добавить badge «Изменить — сейчас УСН 15%» рядом с tax_mode.
- Никаких изменений defaults без явной отметки.

### 5.7 Метрики

**Файл:** [src/lib/metrics/featureMetrics.ts](drivedocs-app/src/lib/metrics/featureMetrics.ts) — расширить документацию.

Новые ключи:
- `wizard.step.entity_type.viewed`
- `wizard.step.entity_type.completed`
- `wizard.draft.resumed` — если восстановили из localStorage
- `essentials.block.opened` (payload: `{ block: 'org' | 'vehicle' | 'driver' }`)
- `essentials.block.completed` (payload: `{ block }`)
- `waybill.essentials.missing` — попытался выпустить путевой без essentials
- `waybill.essentials.scrolled_from_jit` — переход из JIT toast'а

## 6. Acceptance criteria

### Entry
- [ ] Пользователь видит Welcome и понимает что делает приложение за ≤ 30 секунд.
- [ ] Пользователь начинает setup и через 1 экран попадает на Home.
- [ ] Пользователь может закрыть wizard и продолжить позже с того же места.

### Setup
- [ ] Wizard — один экран с одним обязательным полем (entityType).
- [ ] Название организации — опционально, с placeholder-примером по типу.
- [ ] Default'ы (УСН 15%, COMPENSATION) применяются автоматически.
- [ ] Wizard state сохраняется в localStorage.

### Home
- [ ] Home доступен сразу после Phase 1, даже без essentials.
- [ ] Essentials-блоки на Home раскрываются inline (без перехода).
- [ ] Auto-open модалки НЕ срабатывает.
- [ ] Прогресс essentials виден на Home.

### ИНН
- [ ] Поле ИНН валидируется (12 цифр для ИП, 10 для ООО).
- [ ] Есть ссылка «Не помню — найти на egrul.nalog.ru».
- [ ] Открывается в новой вкладке.

### JIT
- [ ] При попытке выпустить путевой без essentials — toast + scroll к essentials.
- [ ] НЕ блокирующая модалка с гигантской формой.
- [ ] Подсветка незаполненных блоков (3 секунды).

### Settings
- [ ] Settings — management, не повторный onboarding.
- [ ] Tax mode и vehicleUsageModel — с явной пометкой текущего значения.
- [ ] Никаких полей, которые уже спрашивались в wizard'е.

## 7. Метрики верификации после релиза

Считаем за 7 дней после релиза F-034.

| Метрика | Формула | Целевая планка |
|---|---|---|
| Wizard completion rate | `onboarding.complete / view.welcome` | ≥ 75% (было ~40%?) |
| TTV до первого действия | median(`addtrip.saved` или `waybill.export` — `onboarding.complete`) | ≤ 5 минут |
| Essentials completion at day 7 | `essentials.block.completed.driver / onboarding.complete` | ≥ 50% |
| Drop-off на wizard | `view.welcome - wizard.step.entity_type.completed` | ≤ 15% |
| JIT-trigger conversion | `waybill.essentials.scrolled_from_jit / waybill.essentials.missing` | ≥ 60% |

Если планки не достигаются — открыть отдельную итерацию F-035 с дополнительными изменениями.

## 8. План реализации

### Slice 1 — Wizard (P0)

1. `src/lib/onboarding/wizardDraft.ts` — persistence helpers
2. `src/features/onboarding/OnboardingWizard.tsx` — сократить до одного шага
3. `src/features/onboarding/steps/EntityTypeStep.tsx` — добавить inline-поле `workspaceName` с placeholder'ом по типу
4. Удалить файлы: `InnStep.tsx`, `TaxModeStep.tsx`, `VehicleModelStep.tsx`, `SummaryStep.tsx`, `WorkspaceNameStep.tsx` (если они станут unused)
5. `OnboardingWizard.handleComplete` — применить default'ы (`taxMode`, `vehicleUsageModel`)

**Объём:** ~200 LOC.

### Slice 2 — Home inline essentials (P0)

1. Создать новый компонент `EssentialsBlocks` (или переписать `EssentialsReminder`)
2. Inline-форма для каждого блока: организация (название + ИНН), авто (марка/модель/госномер), водитель (ФИО)
3. Убрать auto-open `EssentialsSheet`
4. Удалить или переиспользовать `EssentialsSheet.tsx` (можно оставить для Settings-режима)

**Объём:** ~350 LOC.

### Slice 3 — JIT enforcement (P1)

1. В `WaybillPreviewSheet` — проверка essentials перед открытием.
2. Toast-компонент `EssentialsMissingToast` с кнопкой «Перейти к заполнению».
3. Scroll-to-target на Home + 3-секундный border-pulse.

**Объём:** ~150 LOC.

### Slice 4 — Settings чистка (P1)

1. Аудит секций SettingsPage.
2. Убрать дубли wizard'а.
3. Добавить «текущие значения» badges для tax_mode и vehicleUsageModel.

**Объём:** ~80 LOC.

### Slice 5 — Метрики (P1)

1. Добавить новые ключи в featureMetrics.
2. AdminPage — добавить графики `wizard.step.*` и `essentials.block.*`.

**Объём:** ~120 LOC.

**Итого:** ~900 LOC, ~1.5 рабочего дня.

## 9. Риски и mitigation

| Риск | Mitigation |
|---|---|
| Пользователь забил title и не заполняет ИНН — путевой не выпустить | JIT-toast + явный essentials-баннер на Home |
| Default УСН 15% может быть неверным для конкретного пользователя | Явная пометка «Сейчас: УСН 15%» в Settings + ссылка «изменить» |
| Удаление шагов сломает существующих пользователей с прерванным onboarding'ом | Миграция: если `currentStep` в old workspaces указывает на `inn/tax_mode/...` — переводить в `complete` |
| Inline-формы essentials на Home могут перегрузить экран | Default state — collapsed карточки. Раскрывается тапом. |
| Settings пострадает от чистки — пользователи привыкли | Перед merge — sanity-check, что все управляющие действия (изменить тип, изменить ИНН, изменить авто) доступны. |

## 10. Связанные документы

- `knowledge/onboarding-decision.md` — UX-исследование и обоснование (TTV, recognition vs recall, кейсы конкурентов)
- `docs/PRD.md` — общая product spec
- `docs/features.md` — список F-id
- `docs/tasks.md` — task tracking
- `ux-audit-reports/2026-05-15-v2.md` — последний UX-аудит, на котором планка релиза достигнута

## 11. Backwards compatibility

- Существующие workspaces с заполненными tax_mode и vehicleUsageModel — работают без изменений.
- Новые workspaces получают default'ы.
- Поле `workspace.essentialsAck` (deprecated с 2026-05-13) — остаётся для миграции.

## 12. Trace links

- F-026 (essentials reminder) — заменяется/расширяется этой фичей
- F-031 (document ack) — концептуально совместима, blocks acknowledgement остаётся
- F-032 (waybill templates) — interaction с JIT (Slice 3)
- T-145 (visual phase TripsPage и др.) — не пересекается, можно делать параллельно
- US-XXX (как пользователь — см. user-stories.md, обновить при реализации)

---

**Решение принято:** 2026-05-18, на основе обсуждения с владельцем продукта + рекомендации Perplexity + UX-исследования (recognition over recall, TTV, progressive disclosure).

**Готово к реализации.** Стартуем со Slice 1 (Wizard).
