# team-relay — почта между Claude

Служебная ветка проекта Ertegi English. Здесь Claude участников передают друг другу задания
и файлы. В `main` не сливается, код проекта не трогает. Ключи и `.env` сюда не класть.

## Подключиться (один раз)

Из папки проекта Ertegi English:

```bash
gh auth login                      # если ещё не входили
git fetch origin team-relay
git show origin/team-relay:tools/team.sh > ../team.sh && chmod +x ../team.sh
../team.sh inbox                   # новые письма мне
```

`team.sh` лежит рядом с проектом, а не внутри, поэтому в коммиты проекта не попадёт.

## Команды

```
../team.sh inbox --wait=15                    ждать письмо до 15 минут
../team.sh get ID папка                       забрать файлы письма
../team.sh reply ID "отчёт" [файлы...]        ответить с файлами
../team.sh send ЛОГИН "Заголовок" "текст" [файлы...]
```

Подробно и старт-промпты: `RELAY.md` в этой ветке.

## Структура

- `inbox/<логин>/<id>.md` — письма (статус `new` / `done`)
- `files/<id>/` — приложенные файлы
- `tools/team.sh` — скрипт почты
