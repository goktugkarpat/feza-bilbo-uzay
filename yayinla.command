#!/bin/sh
set -eu
cd -- "$(dirname -- "$0")"
printf '%s\n' 'Bu oyun GitHub üzerinde kaynak koduyla birlikte herkese açık yayımlanacak.'
printf '%s' 'Yayımlamak istiyorsan EVET yaz: '
read -r MARS_YAYIN_ONAYI
[ "$MARS_YAYIN_ONAYI" = 'EVET' ] || exit 0
command -v gh >/dev/null || { printf '%s\n' 'Önce GitHub CLI (gh) kurulmalı ve hesabına giriş yapılmalı.'; exit 1; }
MARS_DEPO='goktugkarpat/feza-bilbo-uzay'
if [ ! -d .git ]; then git init -b main; git config user.email goktugkarpat@users.noreply.github.com; fi
git add .
if ! git diff --cached --quiet; then git commit -m 'Feza ve Bilbo: Uzay Macerası güncellemesi' -m 'Co-authored-by: Codex <codex@openai.com>' -m 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'; fi
if ! gh repo view "$MARS_DEPO" >/dev/null 2>&1; then gh repo create "$MARS_DEPO" --public --source=. --remote=origin; fi
if ! git remote get-url origin >/dev/null 2>&1; then git remote add origin "https://github.com/$MARS_DEPO.git"; fi
git push -u origin main
if ! gh api "repos/$MARS_DEPO/pages" >/dev/null 2>&1; then gh api "repos/$MARS_DEPO/pages" -X POST -f 'source[branch]=main' -f 'source[path]=/'; fi
printf '%s\n' 'Oyun GitHub’a gönderildi. Web yayınının hazırlanması birkaç dakika sürebilir.'
