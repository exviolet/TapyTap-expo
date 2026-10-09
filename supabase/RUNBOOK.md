# Локальный Supabase — ранбук

Шпаргалка по локальному стеку TapyTap. Все команды запускаются из корня проекта
(там, где лежит `supabase/config.toml`). Требуется запущенный Docker.

## Адреса и ключи

| Что | Куда |
|---|---|
| Studio (веб-интерфейс БД) | http://127.0.0.1:54323 |
| API (REST/GraphQL/Auth) | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Почта (Mailpit) | http://127.0.0.1:54324 |
| Publishable key | `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH` |
| Legacy anon key (JWT) | стандартный демо-ключ, см. `supabase status` |

Ключи локального стека **одинаковы у всех** и захардкожены в CLI — это не секреты,
их незачем прятать. Актуальный список всегда отдаёт `supabase status`.

## Повседневное

```bash
supabase start      # поднять стек (первый запуск качает ~4-5 ГБ образов)
supabase stop       # остановить, ДАННЫЕ СОХРАНЯЮТСЯ в docker volume
supabase status     # адреса и ключи запущенного стека
```

Полезные варианты:

```bash
supabase stop --no-backup   # остановить и стереть данные подчистую
supabase stop --all         # погасить стеки всех проектов на машине
supabase status -o env      # ключи в виде KEY=value, удобно для скриптов
docker ps --format '{{.Names}}\t{{.Status}}' | grep supabase   # что реально живо
```

`supabase stop` не удаляет данные — после `start` база вернётся в том же состоянии.
Стереть данные можно только через `--no-backup` или `db reset`.

## Схема и миграции

Схема живёт в `supabase/migrations/*.sql` и накатывается в порядке имён файлов.

```bash
supabase db reset            # пересоздать локальную БД: все миграции + seed.sql
supabase migration list      # сравнить локальные и удалённые миграции
supabase migration new имя   # создать пустой файл миграции
```

**`db reset` уничтожает все локальные данные** — включая тестовых пользователей.
Это основной способ проверить, что миграции применяются с нуля.

Изменил схему руками в Studio и хочешь оформить это миграцией:

```bash
supabase db diff -f имя_миграции    # сравнит локальную БД с миграциями и запишет разницу
supabase db diff --linked           # показать расхождение локальных миграций с продом
```

## Синхронизация с продом

Прод-проект: habit-tracker-app, регион ap-southeast-1. Его `<project-ref>` — в `supabase projects list`
(или в `supabase/.temp/project-ref` после `link`; каталог `.temp` в git не попадает).

```bash
supabase projects list                              # список проектов и их статус
supabase link --project-ref <project-ref>    # привязать каталог к проекту
supabase db pull                                    # схема прода → новая миграция
```

```bash
supabase db push    # ОПАСНО: накатывает локальные миграции на ПРОД
```

`db push` меняет боевую базу. Перед ним всегда сначала `supabase migration list`,
чтобы видеть, что именно уедет.

Данные прода `db pull` **не тянет** — только схему. Дамп данных отдельно:

```bash
supabase db dump --linked --data-only -f dump.sql
```

## Запросы к базе

```bash
supabase db query "select count(*) from public.habits"
docker exec -it supabase_db_TapyTap-expo psql -U postgres -d postgres
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres   # если psql стоит в системе
```

Имя контейнера с БД — `supabase_db_TapyTap-expo`, суффикс берётся из
`project_id` в `config.toml`.

## Пользователи и письма

На всех таблицах включён RLS с политиками по `user_id`, поэтому через API
пустой базы не видно ничего, пока нет залогиненного пользователя.
Studio ходит в базу напрямую и RLS игнорирует — там видно всё.

Регистрация из приложения на локальном стеке работает; письмо подтверждения
не уходит наружу, а падает в Mailpit — открой http://127.0.0.1:54324 и подтверди оттуда.

## Подключение приложения к локалке

По умолчанию `src/supabase/supabaseClient.ts` смотрит в **прод**. Чтобы переключить
на локальный стек, поменяй в нём URL и ключ. Учти, как адрес выглядит с устройства:

| Откуда запускается приложение | URL |
|---|---|
| Android-эмулятор | `http://10.0.2.2:54321` |
| iOS-симулятор | `http://127.0.0.1:54321` |
| Реальный телефон в той же Wi-Fi | `http://<LAN-IP-компьютера>:54321` |

`127.0.0.1` внутри Android-эмулятора указывает на сам эмулятор, а не на компьютер —
это самая частая причина «приложение не видит базу».

Файл в `.gitignore`, так что переключение туда-сюда не попадёт в коммиты.

## Грабли

- **CLI младше 2.115.0 ломает `db pull`** — падает с «Access token not provided»
  на шаге «Initialising login role», хотя `projects list` и `link` работают.
  Лечится обновлением: `bun add -g supabase@latest`.
- **Прод засыпает после ~7 дней простоя** (free tier). Тогда `db pull` и `link`
  не работают, DNS хоста БД не резолвится. Будится кнопкой Restore project в дашборде:
  https://supabase.com/dashboard/project/<project-ref>
- **`config.toml` ругается на `[inbucket]`** — секция переименована в `[local_smtp]`.
  Предупреждение безвредное, но при следующей правке конфига стоит переименовать.
- **В базе есть таблица `daily_progress`**, которая не используется ни в одном запросе
  в `src/` — реликт раннего подхода к прогрессу. Не путать с `habit_completions`.
- **После `db reset` контейнер `edge_runtime` остаётся упавшим** (Exited 255), и повторный
  `supabase start` его не поднимает — только сообщает «Stopped services». Лечится точечно:
  `docker start supabase_edge_runtime_TapyTap-expo`. Для TapyTap это неважно: каталога
  `supabase/functions/` в проекте нет, edge functions не используются.
- **`imgproxy` и `pooler` не запускаются вовсе** — pooler выключен в `config.toml`
  (`[db.pooler] enabled = false`), imgproxy нужен только для трансформации картинок в Storage.
- **Все сервисы слушают `0.0.0.0`**, а не только localhost — в недоверенной сети
  локальная база доступна соседям по Wi-Fi.
