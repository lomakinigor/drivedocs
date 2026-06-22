# Подключение Supabase к DriveDocs

Инструкция для активации auth + cloud sync. Занимает ~15 минут.

---

## Шаг 1 — Создать проект Supabase (5 мин)

1. Открой [supabase.com](https://supabase.com) → **Sign in** (можно через GitHub).
2. Кнопка **New project**.
3. Заполни:
   - **Name:** `drivedocs`
   - **Database password:** придумай и **сохрани в менеджер паролей** (понадобится для админ-операций)
   - **Region:** `Central EU (Frankfurt)` — ближайший к Москве
   - **Pricing Plan:** `Free`
4. Жми **Create new project**. Ждёшь 2-3 минуты пока поднимется.

---

## Шаг 2 — Запустить SQL-миграции (3 мин)

В Supabase-дашборде слева:

1. Открой **SQL Editor** (иконка `</>`).
2. Нажми **New query**.
3. **Скопируй и выполни** содержимое:
   - [`drivedocs-app/src/lib/db/schema.sql`](../drivedocs-app/src/lib/db/schema.sql) — создаёт таблицы, индексы, триггер автосоздания `free`-подписки
4. **Новый Query** → **Скопируй и выполни:**
   - [`drivedocs-app/src/lib/db/rls-policies.sql`](../drivedocs-app/src/lib/db/rls-policies.sql) — Row Level Security, чтобы юзер видел только свои данные

Проверка: открой **Table Editor** слева — должны быть 8 таблиц (workspaces, org_profiles, vehicle_profiles, trips, receipts, documents, events, subscriptions).

---

## Шаг 3 — Скопировать ключи (1 мин)

В Supabase-дашборде:

1. **Project Settings** (шестерёнка слева внизу) → **API**.
2. Найди и скопируй:
   - **Project URL** → выглядит как `https://abcdefghijklmnop.supabase.co`
   - **Project API keys → anon public** → длинная строка `eyJhbGciOi...`

⚠️ **anon public** — это публичный ключ, можно класть в frontend. **service_role** — секретный, в frontend НИКОГДА не клади.

---

## Шаг 4 — Прописать в Vercel env (5 мин)

1. Открой [Vercel → drivedocs-v2 → Settings → Environment Variables](https://vercel.com/igorsibola/drivedocs-v2/settings/environment-variables).
2. Add Environment Variable:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** Project URL из шага 3
   - **Environments:** Production + Preview (Development по желанию)
   - **Sensitive:** OFF (URL не секрет)
3. Add another:
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** anon public key из шага 3
   - **Environments:** Production + Preview
   - **Sensitive:** ON (хоть и публичный, маскировка в UI всё равно полезна)
4. **Save**.
5. Слева → **Deployments** → у верхнего деплоя `⋯` → **Redeploy**. Галочку «Use existing Build Cache» **снять**.

---

## Шаг 5 — Включить email-аутентификацию (2 мин)

В Supabase:

1. **Authentication → Providers** (слева).
2. **Email** → должен быть включён по умолчанию.
3. **Authentication → URL Configuration**:
   - **Site URL:** `https://drivedocs-v2.vercel.app`
   - **Redirect URLs:** добавь `https://drivedocs-v2.vercel.app/**`
4. **Authentication → Email Templates** (опционально на сейчас) — можно оставить дефолтные русские/английские письма для подтверждения регистрации и сброса пароля. Позже стилизуешь под бренд.

⚠️ **Confirm email**: по умолчанию Supabase требует подтверждения email через ссылку. Для MVP можно **выключить** в **Authentication → Providers → Email → Confirm email = OFF**, чтобы пользователи могли логиниться сразу. Включим позже когда будет нормальный SMTP (сейчас лимит Supabase = 3 email/hour).

---

## Шаг 6 — Проверка (2 мин)

1. Открой `https://drivedocs-v2.vercel.app/welcome` — теперь в навбаре должна появиться кнопка **«Войти»** рядом с основной CTA.
2. Жми → AuthPage.
3. Создай тестовый аккаунт (email + пароль).
4. Войди → должен перебросить на главную с твоим workspace.
5. Создай 1-2 поездки.
6. Открой Supabase → **Table Editor → trips** — должны появиться записи.
7. Открой инкогнито в другом браузере → войди под тем же email → должны видеться те же поездки.

✅ **Готово.** Cloud sync работает.

---

## Что произойдёт с существующими данными

Если ты или тестовые пользователи уже что-то создали в браузере (localStorage):

- **При первом логине** код автоматически загрузит локальные данные в облако (см. [`hydrateFromBackend`](../drivedocs-app/src/app/store/workspaceStore.ts) — там есть условный upload если cloud пустой)
- На втором и далее устройствах будут видны те же данные

---

## Структура данных в Supabase

Создаётся 8 таблиц:

| Таблица | Что хранит | RLS |
|---------|-----------|-----|
| `workspaces` | Workspace конфиг (ИП/ООО, налоговый режим, модель использования авто) | юзер видит только свои |
| `org_profiles` | Реквизиты (ИНН, ОГРН, название, ФИО владельца) | по workspace_id |
| `vehicle_profiles` | Авто (марка, модель, год, гос.номер, объём, топливо) | по workspace_id |
| `trips` | Поездки (откуда, куда, км, цель, дата) | по workspace_id |
| `receipts` | Чеки (сумма, категория, дата, привязка к поездке) | по workspace_id |
| `documents` | Документы предприятия (договоры, приказы, акты, статус) | по workspace_id |
| `events` | События/уведомления (срок ОСАГО, новая поездка и т.п.) | по workspace_id |
| `subscriptions` | Подписка (free/pro, Stripe IDs — для будущего billing) | автосоздание trigger'ом |

**Автоматический trigger** создаёт строку `subscriptions{plan_code='free'}` при каждом INSERT в `workspaces`.

---

## Что НЕ настраивается этим шагом

- **Realtime subscriptions** — пока polling/refresh, не push. Включим если будет нужно.
- **Edge Functions** для Stripe billing — отдельный шаг когда платный тариф запустим.
- **Storage** для фото чеков — позже, сейчас imageUrl в receipts вырезается из persist.
- **Email SMTP** — пока встроенный лимит Supabase, для прода нужен Resend/SendGrid (~1000 писем/мес бесплатно).

---

## Troubleshooting

**«Войти» кнопка не появилась после redeploy:**
- Проверь что env-переменные точно сохранены (Vercel → Settings → Environment Variables — должно быть две записи)
- Hard reload страницы (Ctrl+Shift+R), service worker мог закешировать старый бандл

**Login возвращает ошибку «Invalid login credentials»:**
- Email подтверждён? Если **Confirm email = ON** — проверь почту (включая Спам)
- Опечатка в пароле? Supabase чувствителен к регистру

**После логина не вижу свои данные:**
- Открой Supabase → Table Editor → workspaces — есть ли там твои записи?
- Если есть, но в приложении нет — открой DevTools → Console, поищи ошибки про RLS
- Возможно RLS-policies не применились, перезапусти `rls-policies.sql`

**«Не удалось загрузить локальные данные в облако» в Settings:**
- Это soft-error, локальные данные остались в браузере
- Открой DevTools → Console, найди `[drivedocs] Failed to upload local data` — увидишь конкретную ошибку
