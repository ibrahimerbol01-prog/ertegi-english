#!/usr/bin/env bash
# claude-team-kit: командная работа нескольких людей (и их Claude) в одном репозитории через gh.
# Запуск из корня репозитория: scripts/team.sh <команда> [аргументы]. Справка: scripts/team.sh help
set -euo pipefail

CONF=".github/team.conf"
DRY_RUN="${DRY_RUN:-0}"
ROLES="lead frontend backend content qa design"

die()  { printf '✗ %s\n' "$*" >&2; exit 1; }
info() { printf '• %s\n' "$*"; }
ok()   { printf '✓ %s\n' "$*"; }
warn() { printf '! %s\n' "$*" >&2; }

# Выполнить команду, меняющую что-то (в режиме --dry-run только показать).
run() {
  if [ "$DRY_RUN" = "1" ]; then printf '[dry-run] %s\n' "$*"; return 0; fi
  "$@"
}

# ---------- настройки ----------
OWNER=""; MAIN_BRANCH="main"; CHECK_CMD=""; MEMBERS=()
load_conf() {
  [ -f "$CONF" ] || die "Нет $CONF. Запустите из корня репозитория, где установлен claude-team-kit."
  local line key val
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%%#*}"                       # убрать комментарий
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    key="${line%%=*}"; val="${line#*=}"
    key="${key//[[:space:]]/}"
    val="${val#"${val%%[![:space:]]*}"}"; val="${val%"${val##*[![:space:]]}"}"
    case "$key" in
      OWNER) OWNER="$val" ;;
      MAIN_BRANCH) MAIN_BRANCH="$val" ;;
      CHECK_CMD) CHECK_CMD="$val" ;;
      MEMBER) MEMBERS+=("$val") ;;
    esac
  done < "$CONF"
  [ -n "$OWNER" ] && [ "$OWNER" != "your-github-login" ] || die "Укажите OWNER в $CONF."
}

need() { command -v "$1" >/dev/null 2>&1 || die "Не найдена программа $1. $2"; }

ME="${TEAM_LOGIN:-}"
my_login() {
  if [ -z "$ME" ]; then ME="$(gh api user --jq .login 2>/dev/null)" || die "gh не авторизован: выполните gh auth login"; fi
  printf '%s' "$ME"
}

role_of() {  # роль по логину из team.conf
  local m
  for m in "${MEMBERS[@]+"${MEMBERS[@]}"}"; do
    [ "${m%%:*}" = "$1" ] && { printf '%s' "${m#*:}"; return 0; }
  done
  return 1
}

valid_role() { [[ " $ROLES " == *" $1 "* ]]; }

current_branch() { git rev-parse --abbrev-ref HEAD; }

issue_from_branch() {  # frontend/12-ekran-kviza -> 12
  local b; b="$(current_branch)"
  [[ "$b" =~ /([0-9]+)- ]] || [[ "$b" =~ /([0-9]+)$ ]] || die "В имени ветки $b нет номера задачи. Начинайте работу через: scripts/team.sh start <номер>"
  printf '%s' "${BASH_REMATCH[1]}"
}

require_clean() {
  git diff --quiet && git diff --cached --quiet || die "Есть незакоммиченные изменения. Сделайте коммит или git stash."
}

require_not_main() {
  [ "$(current_branch)" != "$MAIN_BRANCH" ] || die "Вы в $MAIN_BRANCH. Работайте в своей ветке: scripts/team.sh start <номер>"
}

slugify() {  # кириллица -> латиница, всё остальное -> дефисы, не длиннее 40 символов
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed \
    -e 's/а/a/g;s/б/b/g;s/в/v/g;s/г/g/g;s/д/d/g;s/е/e/g;s/ё/e/g;s/ж/zh/g;s/з/z/g;s/и/i/g;s/й/y/g' \
    -e 's/к/k/g;s/л/l/g;s/м/m/g;s/н/n/g;s/о/o/g;s/п/p/g;s/р/r/g;s/с/s/g;s/т/t/g;s/у/u/g;s/ф/f/g' \
    -e 's/х/h/g;s/ц/ts/g;s/ч/ch/g;s/ш/sh/g;s/щ/sch/g;s/ъ//g;s/ы/y/g;s/ь//g;s/э/e/g;s/ю/yu/g;s/я/ya/g' \
    -e 's/ә/a/g;s/ғ/g/g;s/қ/q/g;s/ң/n/g;s/ө/o/g;s/ұ/u/g;s/ү/u/g;s/һ/h/g;s/і/i/g' \
    -e 's/А/a/g;s/Б/b/g;s/В/v/g;s/Г/g/g;s/Д/d/g;s/Е/e/g;s/Ж/zh/g;s/З/z/g;s/И/i/g;s/К/k/g;s/Л/l/g' \
    -e 's/М/m/g;s/Н/n/g;s/О/o/g;s/П/p/g;s/Р/r/g;s/С/s/g;s/Т/t/g;s/У/u/g;s/Ф/f/g;s/Х/h/g;s/Ч/ch/g' \
    -e 's/Ш/sh/g;s/Э/e/g;s/Ю/yu/g;s/Я/ya/g' \
    | LC_ALL=C sed -e 's/[^a-z0-9]\{1,\}/-/g' -e 's/^-//' -e 's/-$//' | cut -c1-40 | sed 's/-$//'
}

# ---------- команды ----------
cmd_help() {
  cat <<'EOF'
scripts/team.sh — работа команды через GitHub

Для всех:
  doctor                 проверить gh, git, настройки и секреты
  task "Название" РОЛЬ   создать задачу (роли: lead frontend backend content qa design)
  start НОМЕР            взять задачу: назначиться и создать ветку от свежего main
  sync                   подтянуть свежий main в свою ветку (rebase)
  pr                     проверки, push и PR с "Closes #НОМЕР"
  note НОМЕР "текст"     записка о передаче работы в задачу
  board                  доска: задачи по статусам и открытые PR

Почта между Claude (ветка team-relay, в main не попадает):
  send ЛОГИН "Заголовок" "текст"|файл.md|- [файлы...]   письмо с файлами
  inbox [--all] [--wait[=МИН]]   новые письма мне; --wait ждёт до МИН минут (10)
  read ID                        показать письмо
  reply ID "текст"|файл.md|- [файлы...]   ответить, письмо станет done
  done ID                        отметить прочитанным без ответа
  get ID [папка]                 скопировать файлы письма к себе

Только владелец:
  setup                  метки, защита main, удаление веток после слияния
  merge НОМЕР_PR         проверить и слить PR (squash)

Флаг --dry-run (или DRY_RUN=1) показывает изменяющие команды, не выполняя их.
EOF
}

cmd_doctor() {
  local bad=0
  command -v git >/dev/null && ok "git есть" || { warn "нет git"; bad=1; }
  if command -v gh >/dev/null; then
    ok "gh есть"
    if gh auth status >/dev/null 2>&1; then ok "gh авторизован как $(my_login)"; else warn "gh не авторизован: gh auth login"; bad=1; fi
  else warn "нет gh: https://cli.github.com"; bad=1; fi
  git rev-parse --git-dir >/dev/null 2>&1 && ok "это git-репозиторий" || { warn "не git-репозиторий"; bad=1; }
  ok "владелец: $OWNER, основная ветка: $MAIN_BRANCH, участников: ${#MEMBERS[@]}"
  if [ "${#MEMBERS[@]}" -gt 0 ]; then
    local m r; for m in "${MEMBERS[@]}"; do r="${m#*:}"; valid_role "$r" || { warn "неизвестная роль '$r' у ${m%%:*}"; bad=1; }; done
  fi
  # Секреты под git
  local tracked
  tracked="$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v -E '\.env\.example$' || true)"
  if [ -n "$tracked" ]; then warn "под git лежат файлы окружения (уберите: git rm --cached):"; printf '    %s\n' $tracked >&2; bad=1
  else ok "файлов .env под git нет"; fi
  grep -qE '^\.env' .gitignore 2>/dev/null && ok ".env в .gitignore" || { warn "добавьте .env* в .gitignore"; bad=1; }
  [ "$bad" = 0 ] && ok "всё готово" || { warn "есть что поправить (см. выше)"; return 1; }
}

cmd_setup() {
  [ "$(my_login)" = "$OWNER" ] || die "setup делает только владелец ($OWNER)."
  info "Создаю метки"
  local r
  for r in $ROLES; do run gh label create "role:$r" --color 1d76db --description "Роль $r" --force; done
  run gh label create "status:ready"       --color c2e0c6 --description "Можно брать" --force
  run gh label create "status:in-progress" --color fbca04 --description "В работе" --force
  run gh label create "status:review"      --color 5319e7 --description "PR ждёт владельца" --force
  run gh label create "status:blocked"     --color b60205 --description "Застряло, нужен человек" --force
  run gh label create "type:task"          --color ededed --description "Задача" --force
  run gh label create "type:bug"           --color d73a4a --description "Ошибка" --force
  run gh label create "shared"             --color 000000 --description "Общие файлы: зависимости, миграции, сборка" --force
  run gh label create "demo"               --color f9d0c4 --description "Нужно для демо" --force

  info "Настраиваю репозиторий: squash-слияние, удаление веток после слияния"
  run gh repo edit --enable-squash-merge --delete-branch-on-merge || warn "не удалось изменить настройки репозитория"

  info "Защищаю $MAIN_BRANCH: только через PR с одобрением владельца, без force-push"
  local repo; repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
  local body='{"required_status_checks":null,"enforce_admins":false,"required_pull_request_reviews":{"required_approving_review_count":1,"require_code_owner_reviews":true,"dismiss_stale_reviews":true},"restrictions":null,"allow_force_pushes":false,"allow_deletions":false}'
  if [ "$DRY_RUN" = "1" ]; then
    printf '[dry-run] gh api -X PUT repos/%s/branches/%s/protection\n' "$repo" "$MAIN_BRANCH"
  elif printf '%s' "$body" | gh api -X PUT "repos/$repo/branches/$MAIN_BRANCH/protection" --input - >/dev/null 2>&1; then
    ok "$MAIN_BRANCH защищена"
  else
    warn "Защиту включить не удалось. Частые причины: в $MAIN_BRANCH ещё нет коммитов, или репозиторий приватный на бесплатном тарифе."
    warn "Тогда правило держится на договорённости и CLAUDE.md; владелец остаётся единственным, кто сливает."
  fi
  ok "Готово. Пригласите участников: Settings → Collaborators (роль Write)."
}

cmd_task() {
  local title="${1:-}" role="${2:-}" body="${3:-}"
  [ -n "$title" ] && [ -n "$role" ] || die 'Использование: scripts/team.sh task "Название" РОЛЬ ["описание"]'
  valid_role "$role" || die "Роль '$role' не из списка: $ROLES"
  [ -n "$body" ] || body="Создано через scripts/team.sh. Допишите: что нужно сделать и когда готово."
  run gh issue create --title "$title" --body "$body" --label "type:task" --label "status:ready" --label "role:$role"
}

cmd_start() {
  local n="${1:-}"; [[ "$n" =~ ^[0-9]+$ ]] || die "Использование: scripts/team.sh start НОМЕР_ЗАДАЧИ"
  require_clean
  local title labels role slug branch
  title="$(gh issue view "$n" --json title --jq .title)" || die "Задача #$n не найдена"
  labels="$(gh issue view "$n" --json labels --jq '[.labels[].name] | join(" ")')"
  role="$(printf '%s\n' $labels | sed -n 's/^role://p' | head -1)"
  [ -n "$role" ] || role="$(role_of "$(my_login)")" || role="task"
  slug="$(slugify "$title")"; [ -n "$slug" ] || slug="task"
  branch="$role/$n-$slug"

  run git fetch origin "$MAIN_BRANCH"
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    info "Ветка $branch уже есть, переключаюсь"; run git switch "$branch"
  else
    run git switch --no-track -c "$branch" "origin/$MAIN_BRANCH"
  fi
  run gh issue edit "$n" --add-assignee "@me" --add-label "status:in-progress"
  run gh issue edit "$n" --remove-label "status:ready" >/dev/null 2>&1 || true
  run git push -u origin "$branch"
  ok "Задача #$n: $title"
  ok "Ветка: $branch. Когда закончите: scripts/team.sh pr"
}

cmd_sync() {
  require_not_main; require_clean
  run git fetch origin "$MAIN_BRANCH"
  if run git rebase "origin/$MAIN_BRANCH"; then
    ok "Ветка $(current_branch) обновлена от $MAIN_BRANCH"
  else
    warn "Конфликт. Поправьте файлы, затем: git add <файлы> && git rebase --continue"
    warn "Передумали: git rebase --abort"
    return 1
  fi
}

cmd_pr() {
  require_not_main; require_clean
  local n branch title existing body_file
  n="$(issue_from_branch)"; branch="$(current_branch)"
  if [ "$(git rev-list --count "origin/$MAIN_BRANCH..HEAD" 2>/dev/null || echo 0)" = "0" ]; then
    die "В ветке нет новых коммитов относительно $MAIN_BRANCH."
  fi
  if [ -n "$CHECK_CMD" ]; then
    info "Проверки: $CHECK_CMD"
    if [ "$DRY_RUN" = "1" ]; then printf '[dry-run] bash -c %q\n' "$CHECK_CMD"
    else bash -c "$CHECK_CMD" || die "Проверки не прошли. Исправьте и повторите."; fi
  fi
  # Обычный push; после sync (rebase) — с --force-with-lease, только в свою ветку.
  if ! run git push -u origin "$branch" 2>/dev/null; then
    info "Ветка переписана после sync, отправляю с --force-with-lease"
    run git push --force-with-lease -u origin "$branch" || die "GitHub не принял ветку: в ней есть чужие коммиты. Выполните git pull --rebase origin $branch и повторите."
  fi
  existing="$(gh pr list --head "$branch" --state open --json url --jq '.[0].url' 2>/dev/null || true)"
  if [ -n "$existing" ]; then ok "PR уже открыт, обновлён: $existing"; return 0; fi
  title="$(gh issue view "$n" --json title --jq .title) (#$n)"
  body_file="$(mktemp)"
  if [ -f .github/pull_request_template.md ]; then
    sed "s/^Closes #\$/Closes #$n/" .github/pull_request_template.md > "$body_file"
  else
    printf 'Closes #%s\n' "$n" > "$body_file"
  fi
  run gh pr create --base "$MAIN_BRANCH" --head "$branch" --title "$title" --body-file "$body_file"
  rm -f "$body_file"
  run gh issue edit "$n" --add-label "status:review"
  run gh issue edit "$n" --remove-label "status:in-progress" >/dev/null 2>&1 || true
  ok "PR открыт. Допишите в нём «Что сделано» и «Как проверить», сливает владелец."
}

cmd_note() {
  local n="${1:-}" text="${2:-}"
  [[ "$n" =~ ^[0-9]+$ ]] && [ -n "$text" ] || die 'Использование: scripts/team.sh note НОМЕР "текст"'
  run gh issue comment "$n" --body "**Передача** от @$(my_login), $(date '+%Y-%m-%d %H:%M'):

$text"
}

cmd_board() {
  local s
  for s in in-progress review blocked ready; do
    printf '\n== status:%s ==\n' "$s"
    gh issue list --state open --label "status:$s" --limit 100 \
      --json number,title,assignees,labels \
      --jq '.[] | "#\(.number)  \(.title)  [\([.labels[].name | select(startswith("role:")) | ltrimstr("role:")] | join(","))]  \([.assignees[].login] | map("@"+.) | join(" "))"'
  done
  printf '\n== открытые PR ==\n'
  gh pr list --state open --json number,title,author,reviewDecision \
    --jq '.[] | "PR #\(.number)  \(.title)  @\(.author.login)  \(.reviewDecision // "ждёт ревью")"'
}

cmd_merge() {
  local pr="${1:-}"; [[ "$pr" =~ ^[0-9]+$ ]] || die "Использование: scripts/team.sh merge НОМЕР_PR"
  [ "$(my_login)" = "$OWNER" ] || die "Сливает только владелец ($OWNER)."
  info "Проверки PR #$pr"
  if ! gh pr checks "$pr" 2>/dev/null; then
    [ "${FORCE:-0}" = "1" ] || die "Проверки не зелёные (или их нет). Слить всё равно: FORCE=1 scripts/team.sh merge $pr"
  fi
  run gh pr merge "$pr" --squash --delete-branch
  ok "PR #$pr слит. Остальным: scripts/team.sh sync"
}

# ---------- почта между Claude: ветка team-relay ----------
# Сообщения и файлы лежат в отдельной ветке (в main не попадают):
#   inbox/<логин>/<id>.md   письмо (front matter: id, from, to, status, reply_to)
#   files/<id>/...          приложенные файлы
RELAY_BRANCH="${RELAY_BRANCH:-team-relay}"
RD=""

relay_open() {  # рабочая копия ветки почты в .git/team-relay, свежая
  RD="$(cd "$(git rev-parse --git-common-dir)" && pwd)/team-relay"
  local have_remote=0
  git fetch -q origin "+refs/heads/$RELAY_BRANCH:refs/remotes/origin/$RELAY_BRANCH" 2>/dev/null && have_remote=1
  if [ ! -e "$RD/.git" ]; then
    git worktree prune
    if [ "$have_remote" = 1 ]; then
      git worktree add -q --force -B "$RELAY_BRANCH" "$RD" "origin/$RELAY_BRANCH"
    else
      git worktree add -q --detach "$RD" HEAD
      git -C "$RD" checkout -q --orphan "$RELAY_BRANCH"
      git -C "$RD" rm -rq --cached . >/dev/null 2>&1 || true
      find "$RD" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
      mkdir -p "$RD/inbox" "$RD/files"
      printf '# team-relay\n\nПочта между Claude участников: scripts/team.sh send | inbox | reply.\nНе сливать в main. Ключи сюда не класть.\n' > "$RD/README.md"
      git -C "$RD" add -A
      git -C "$RD" -c user.name="$(git config user.name || echo team)" -c user.email="$(git config user.email || echo team@local)" commit -qm "relay: начало"
    fi
  elif [ "$have_remote" = 1 ]; then
    git -C "$RD" pull -q --rebase origin "$RELAY_BRANCH" || die "Не удалось обновить почту: git -C $RD status"
  fi
}

relay_push() {  # relay_push "сообщение коммита"
  git -C "$RD" add -A
  git -C "$RD" diff --cached --quiet && return 0
  git -C "$RD" -c user.name="$(git config user.name || my_login)" -c user.email="$(git config user.email || echo "$(my_login)@users.noreply.github.com")" commit -qm "$1"
  local i
  for i in 1 2 3; do
    git -C "$RD" push -q -u origin "$RELAY_BRANCH" 2>/dev/null && return 0
    git -C "$RD" pull -q --rebase origin "$RELAY_BRANCH" || true
    sleep "$i"
  done
  die "Не удалось отправить почту на GitHub (проверьте доступ на запись)."
}

relay_find() {  # путь письма по id
  local f; f="$(find "$RD/inbox" -name "$1.md" 2>/dev/null | head -1)"
  [ -n "$f" ] || die "Письмо $1 не найдено. Список: scripts/team.sh inbox --all"
  printf '%s' "$f"
}

relay_field() { sed -n "s/^$2: //p" "$1" | head -1; }

relay_attach() {  # relay_attach ID файл... — копирует файлы в files/ID/
  local id="$1" p; shift
  for p in "$@"; do
    [ -e "$p" ] || die "Нет файла $p"
    case "$(basename "$p")" in .env|.env.*) [ "$(basename "$p")" = ".env.example" ] || die "Файлы окружения не пересылаются: $p";; esac
    mkdir -p "$RD/files/$id"
    cp -R "$p" "$RD/files/$id/"
  done
}

relay_write() {  # relay_write ID TO TITLE BODY REPLY_TO
  local id="$1" to="$2" title="$3" body="$4" re="$5" f
  mkdir -p "$RD/inbox/$to"; f="$RD/inbox/$to/$id.md"
  {
    printf -- '---\nid: %s\nfrom: %s\nto: %s\nstatus: new\ncreated: %s\n' "$id" "$(my_login)" "$to" "$(date '+%Y-%m-%d %H:%M')"
    [ -n "$re" ] && printf 'reply_to: %s\n' "$re"
    printf -- '---\n\n# %s\n\n%s\n' "$title" "$body"
  } > "$f"
  if [ -d "$RD/files/$id" ]; then
    printf '\n## Файлы\n\n'  >> "$f"
    (cd "$RD/files/$id" && find . -type f | sed 's|^\./|- files/'"$id"'/|') >> "$f"
  fi
}

read_body() { if [ "$1" = "-" ]; then cat; elif [ -f "$1" ]; then cat "$1"; else printf '%s' "$1"; fi; }

new_id() { printf '%s-%s-%s' "$(date '+%m%d-%H%M%S')" "$(my_login | cut -c1-12)" "$(slugify "$1" | cut -c1-20)" | sed 's/-$//'; }

cmd_send() {
  local to="${1:-}" title="${2:-}" text="${3:-}"
  [ -n "$to" ] && [ -n "$title" ] && [ -n "$text" ] || die 'Использование: scripts/team.sh send ЛОГИН "Заголовок" "текст"|файл.md|- [файлы...]'
  shift 3
  relay_open
  local id body; id="$(new_id "$title")"; body="$(read_body "$text")"
  relay_attach "$id" "$@"
  relay_write "$id" "$to" "$title" "$body" ""
  relay_push "relay: $(my_login) → $to: $title"
  ok "Отправлено @$to: $id"
}

relay_show() {  # печать письма и полных путей к файлам
  cat "$1"
  local id; id="$(relay_field "$1" id)"
  if [ -d "$RD/files/$id" ]; then
    printf '\nФайлы лежат в: %s\n' "$RD/files/$id"
  fi
  printf '\n'
}

cmd_inbox() {
  local all=0 wait=0 mins=10 a
  for a in "$@"; do case "$a" in --all) all=1 ;; --wait) wait=1 ;; --wait=*) wait=1; mins="${a#--wait=}" ;; esac; done
  local me; me="$(my_login)"
  local deadline=$(( $(date +%s) + mins * 60 ))
  while :; do
    relay_open
    local f n=0
    for f in "$RD/inbox/$me"/*.md; do
      [ -e "$f" ] || continue
      if [ "$all" = 1 ]; then
        printf '%s  [%s]  от @%s  %s\n' "$(relay_field "$f" id)" "$(relay_field "$f" status)" "$(relay_field "$f" from)" "$(sed -n 's/^# //p' "$f" | head -1)"
        n=$((n+1))
      elif [ "$(relay_field "$f" status)" = "new" ]; then
        printf '==================== %s\n' "$(relay_field "$f" id)"; relay_show "$f"; n=$((n+1))
      fi
    done
    if [ "$n" -gt 0 ] || [ "$wait" = 0 ]; then
      [ "$n" -gt 0 ] || info "Новых писем для @$me нет."
      return 0
    fi
    [ "$(date +%s)" -lt "$deadline" ] || { info "За $mins мин писем не пришло."; return 0; }
    sleep 30
  done
}

cmd_read() { [ -n "${1:-}" ] || die "Использование: scripts/team.sh read ID"; relay_open; relay_show "$(relay_find "$1")"; }

relay_set_status() {  # relay_set_status FILE STATUS
  sed -i.bak "s/^status: .*/status: $2/" "$1" && rm -f "$1.bak"
}

cmd_reply() {
  local re="${1:-}" text="${2:-}"
  [ -n "$re" ] && [ -n "$text" ] || die 'Использование: scripts/team.sh reply ID "текст"|файл.md|- [файлы...]'
  shift 2
  relay_open
  local orig to title id body
  orig="$(relay_find "$re")"; to="$(relay_field "$orig" from)"
  title="Ответ: $(sed -n 's/^# //p' "$orig" | head -1)"
  id="$(new_id "$title")"; body="$(read_body "$text")"
  relay_attach "$id" "$@"
  relay_write "$id" "$to" "$title" "$body" "$re"
  relay_set_status "$orig" "done"
  relay_push "relay: $(my_login) → $to: ответ на $re"
  ok "Ответ отправлен @$to: $id"
}

cmd_done() {
  [ -n "${1:-}" ] || die "Использование: scripts/team.sh done ID"
  relay_open; relay_set_status "$(relay_find "$1")" "done"; relay_push "relay: $1 прочитано"; ok "$1 отмечено как прочитанное"
}

cmd_get() {  # скопировать файлы письма в рабочую папку
  local id="${1:-}" dest="${2:-.}"
  [ -n "$id" ] || die "Использование: scripts/team.sh get ID [куда]"
  relay_open
  [ -d "$RD/files/$id" ] || die "У письма $id нет файлов."
  mkdir -p "$dest"; cp -R "$RD/files/$id/." "$dest/"
  ok "Файлы письма $id скопированы в $dest"
}

# ---------- разбор аргументов ----------
args=()
for a in "$@"; do
  case "$a" in --dry-run) DRY_RUN=1 ;; *) args+=("$a") ;; esac
done
set -- "${args[@]+"${args[@]}"}"
cmd="${1:-help}"; shift || true

case "$cmd" in
  help|-h|--help) cmd_help; exit 0 ;;
esac
need git "Установите git."
case "$cmd" in
  send|inbox|read|reply|done|get) [ -n "$ME" ] || need gh "Установите GitHub CLI или задайте TEAM_LOGIN=ваш-логин" ;;
  *) need gh "Установите GitHub CLI: https://cli.github.com" ;;
esac
case "$cmd" in
  send|inbox|read|reply|done|get) [ ! -f "$CONF" ] || load_conf ;;  # почте team.conf не обязателен
  *) load_conf ;;
esac
case "$cmd" in
  doctor) cmd_doctor ;;
  setup)  cmd_setup ;;
  task)   cmd_task "$@" ;;
  start)  cmd_start "$@" ;;
  sync)   cmd_sync ;;
  pr)     cmd_pr ;;
  note)   cmd_note "$@" ;;
  board)  cmd_board ;;
  merge)  cmd_merge "$@" ;;
  send)   cmd_send "$@" ;;
  inbox)  cmd_inbox "$@" ;;
  read)   cmd_read "$@" ;;
  reply)  cmd_reply "$@" ;;
  done)   cmd_done "$@" ;;
  get)    cmd_get "$@" ;;
  *) cmd_help; die "Неизвестная команда: $cmd" ;;
esac
