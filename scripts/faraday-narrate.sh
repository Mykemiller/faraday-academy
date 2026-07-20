#!/usr/bin/env bash
# faraday-narrate.sh — render queued Faraday Academy audio narration (Gil/Mach voices)
# via ElevenLabs, store in Cloudflare R2, and mark the jobs produced in Supabase.
#
# Runs in an environment where api.elevenlabs.io egress is ALLOWED (e.g. the Walt setup).
# The Claude Code session that authored the courses cannot reach ElevenLabs (org egress
# policy denies it), so this script is the hand-off runner. It is idempotent: it only
# touches rows the DB view still reports as 'queued'.
#
# Config (all mode 600, NONE committed) — mirrors the Walt convention:
#   ~/.config/walt/elevenlabs.key            plain text ElevenLabs API key
#   ~/.config/walt/faraday-supabase.json     {"project_url":"https://ycadmmngkdhvpcsrcuaq.supabase.co","service_role_key":"..."}
#   ~/.config/walt/r2.json                   {"account_id","access_key_id","secret_access_key","bucket_name","endpoint"}
#   ~/.config/walt/voices.json  (optional)   {"Gil":"bV9ai9Wem8olqrkR49Zw","Mach":"<voice_id>"}   # Gil default below
# Requires: curl, jq, aws (R2-compatible). Optional: ffprobe (for exact duration).
#
# Usage:
#   scripts/faraday-narrate.sh [--limit N] [--dry-run] [--voice-gil ID] [--voice-mach ID]
set -euo pipefail

CFG="$HOME/.config/walt"
EL_KEY_FILE="$CFG/elevenlabs.key"
SB_FILE="$CFG/faraday-supabase.json"
R2_FILE="$CFG/r2.json"
VOICES_FILE="$CFG/voices.json"
MODEL="eleven_multilingual_v2"
GIL_VOICE="${VOICE_GIL:-bV9ai9Wem8olqrkR49Zw}"     # Gil Faraday brand voice
MACH_VOICE="${VOICE_MACH:-QIhD5ivPGEoYZQDocuHI}"    # Mach Faraday brand voice
LIMIT=0; DRY=0
while [ $# -gt 0 ]; do case "$1" in
  --limit) LIMIT="$2"; shift 2;;
  --dry-run) DRY=1; shift;;
  --voice-gil) GIL_VOICE="$2"; shift 2;;
  --voice-mach) MACH_VOICE="$2"; shift 2;;
  *) echo "unknown arg: $1" >&2; exit 2;;
esac; done

for f in "$EL_KEY_FILE" "$SB_FILE" "$R2_FILE"; do
  [ -f "$f" ] || { echo "MISSING config: $f — create it (mode 600) and re-run." >&2; exit 1; }
done
command -v jq  >/dev/null || { echo "need jq";  exit 1; }
command -v aws >/dev/null || { echo "need aws (R2-compatible)"; exit 1; }
[ -f "$VOICES_FILE" ] && { GIL_VOICE="$(jq -r '.Gil // empty' "$VOICES_FILE"):-$GIL_VOICE"; MACH_VOICE="$(jq -r '.Mach // empty' "$VOICES_FILE")"; }

EL_KEY="$(cat "$EL_KEY_FILE")"
SB_URL="$(jq -r .project_url "$SB_FILE")"
SB_KEY="$(jq -r .service_role_key "$SB_FILE")"
R2_ENDPOINT="$(jq -r .endpoint "$R2_FILE")"
R2_BUCKET="$(jq -r .bucket_name "$R2_FILE")"
R2_ACCOUNT="$(jq -r .account_id "$R2_FILE")"
export AWS_ACCESS_KEY_ID="$(jq -r .access_key_id "$R2_FILE")"
export AWS_SECRET_ACCESS_KEY="$(jq -r .secret_access_key "$R2_FILE")"

sb() { curl -sS -H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY" "$@"; }

echo "Fetching queued narration jobs…"
QUEUE="$(sb "$SB_URL/rest/v1/academy_narration_queue?select=*")"
N="$(echo "$QUEUE" | jq 'length')"
echo "queued jobs: $N"
[ "$N" -eq 0 ] && { echo "nothing to do"; exit 0; }
[ "$LIMIT" -gt 0 ] && QUEUE="$(echo "$QUEUE" | jq ".[:$LIMIT]")"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ok=0; fail=0
echo "$QUEUE" | jq -c '.[]' | while read -r row; do
  MID=$(jq -r .media_id <<<"$row")
  CODE=$(jq -r .course_code <<<"$row")
  VOICE=$(jq -r .voice <<<"$row")
  MP=$(jq -r .module_position <<<"$row"); LP=$(jq -r .lesson_position <<<"$row")
  case "$VOICE" in
    Gil)  VID="$GIL_VOICE";;
    Mach) VID="$MACH_VOICE";;
    *)    VID="$GIL_VOICE";;
  esac
  if [ -z "$VID" ]; then echo "  [$CODE m${MP}l${LP}] no voice id for $VOICE — skipping"; continue; fi
  KEY="academy/audio/$CODE/m${MP}l${LP}.mp3"
  echo "  -> $CODE m${MP}l${LP} ($VOICE)"
  if [ "$DRY" -eq 1 ]; then continue; fi

  # 1) TTS
  jq -r .script <<<"$row" > "$TMP/script.txt"
  jq -Rs "{text:., model_id:\"$MODEL\", voice_settings:{stability:0.5, similarity_boost:0.75}}" "$TMP/script.txt" > "$TMP/body.json"
  HTTP=$(curl -sS -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VID" \
    -H "xi-api-key: $EL_KEY" -H "Content-Type: application/json" \
    --data @"$TMP/body.json" --output "$TMP/out.mp3" -w "%{http_code}")
  if [ "$HTTP" != "200" ] || ! head -c3 "$TMP/out.mp3" | grep -q . ; then
    echo "     TTS failed (HTTP $HTTP)"; sb -X PATCH "$SB_URL/rest/v1/academy_course_media?id=eq.$MID" \
      -H "Content-Type: application/json" -d '{"status":"failed"}' >/dev/null; fail=$((fail+1)); continue
  fi
  BYTES=$(wc -c < "$TMP/out.mp3")
  DUR=""; command -v ffprobe >/dev/null && DUR=$(ffprobe -v quiet -of csv=p=0 -show_entries format=duration "$TMP/out.mp3" 2>/dev/null || true)

  # 2) R2 upload
  aws s3 cp "$TMP/out.mp3" "s3://$R2_BUCKET/$KEY" --endpoint-url "$R2_ENDPOINT" --only-show-errors
  R2_URL="https://$R2_BUCKET.$R2_ACCOUNT.r2.cloudflarestorage.com/$KEY"

  # 3) mark produced
  PAYLOAD=$(jq -n --arg u "$R2_URL" --arg v "$VOICE" --arg d "${DUR:-}" --argjson b "$BYTES" \
    '{status:"produced", provider:"elevenlabs", r2_url:$u, voice:$v,
      duration_seconds: ( ($d|select(.!="")|tonumber) // null ),
      generated_at: (now|todate),
      meta: {model:"'"$MODEL"'", bytes:$b}}')
  sb -X PATCH "$SB_URL/rest/v1/academy_course_media?id=eq.$MID" -H "Content-Type: application/json" -H "Prefer: return=minimal" -d "$PAYLOAD" >/dev/null
  ok=$((ok+1))
done
echo "done."
