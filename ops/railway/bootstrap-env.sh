#!/usr/bin/env bash
# bootstrap-env.sh <dev|uat|production> <api-url> <web-url>
#
# Prepares one Railway environment of the escalating-reminders project for
# .railway/railway.ts. Idempotent: re-running leaves existing secrets alone.
#
#   1. Creates the environment if it does not exist, and links to it.
#   2. Generates JWT_SECRET / JWT_REFRESH_SECRET if unset (never printed).
#   3. Sets the URL-derived variables: CORS_ORIGIN, NEXT_PUBLIC_API_URL,
#      STORE_WEBHOOK_URL, SMS_INBOUND_WEBHOOK_URL, SMS_STATUS_WEBHOOK_URL.
#   4. Copies relay secrets from the caller's environment when present
#      (NOCTUSOFT_API_KEY, RELAY_WEBHOOK_SECRET, RELAY_INBOUND_SECRET,
#      GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET). Run it under 1Password so they
#      never touch the shell or the screen:
#        op run --env-file=ops/railway/<env>.op.env -- ./ops/railway/bootstrap-env.sh uat <api-url> <web-url>
#      where <env>.op.env holds op://… references only (gitignored or not, it has no values).
#   5. Prints `railway config plan`. It does not apply; apply after review.
#
# Secrets are written with `railway variable set --stdin`, so no value appears
# in arguments, logs, or output.
set -euo pipefail

ENV="${1:-}"; API_URL="${2:-}"; WEB_URL="${3:-}"
case "$ENV" in dev|uat|production) ;; *)
  echo "Usage: $0 <dev|uat|production> <api-url> <web-url>"; exit 1 ;;
esac
[[ "$API_URL" == https://* && "$WEB_URL" == https://* ]] || { echo "api-url and web-url must be https:// URLs"; exit 1; }
API_URL="${API_URL%/}"; WEB_URL="${WEB_URL%/}"

BACKEND=(api worker scheduler)

has_var() { # service key
  railway variable list --service "$1" --environment "$ENV" --json 2>/dev/null \
    | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('$2') else 1)"
}
set_plain() { # service key value
  railway variable set "$2=$3" --service "$1" --environment "$ENV" --skip-deploys >/dev/null
}
set_secret() { # service key  (value on stdin)
  railway variable set "$2" --stdin --service "$1" --environment "$ENV" --skip-deploys >/dev/null
}

echo "== escalating-reminders: $ENV"

echo "[1/5] environment"
if railway environment list --json 2>/dev/null \
    | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if any(e.get('name')=='$ENV' for e in d) else 1)"; then
  echo "  exists"
else
  railway environment new "$ENV" >/dev/null && echo "  created"
fi
railway environment link "$ENV" >/dev/null

echo "[2/5] JWT secrets"
for KEY in JWT_SECRET JWT_REFRESH_SECRET; do
  if has_var api "$KEY"; then
    echo "  $KEY already set"
  else
    VALUE=$(openssl rand -hex 32)
    for SVC in "${BACKEND[@]}"; do printf '%s' "$VALUE" | set_secret "$SVC" "$KEY"; done
    unset VALUE
    echo "  $KEY generated"
  fi
done

echo "[3/5] URLs"
for SVC in "${BACKEND[@]}"; do
  set_plain "$SVC" CORS_ORIGIN "$WEB_URL"
  set_plain "$SVC" STORE_WEBHOOK_URL "$API_URL/v1/webhooks/store"   # /health and the SMS hooks are outside /v1; the store hook is not
  set_plain "$SVC" SMS_INBOUND_WEBHOOK_URL "$API_URL/webhooks/sms"
  set_plain "$SVC" SMS_STATUS_WEBHOOK_URL "$API_URL/webhooks/sms-status"
done
set_plain web NEXT_PUBLIC_API_URL "$API_URL"
echo "  api=$API_URL web=$WEB_URL"

echo "[4/5] relay and OAuth secrets"
MISSING=()
for KEY in NOCTUSOFT_API_KEY RELAY_WEBHOOK_SECRET RELAY_INBOUND_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
  if [[ -n "${!KEY:-}" ]]; then
    for SVC in "${BACKEND[@]}"; do printf '%s' "${!KEY}" | set_secret "$SVC" "$KEY"; done
    echo "  $KEY set"
  elif has_var api "$KEY"; then
    echo "  $KEY already set"
  else
    MISSING+=("$KEY")
  fi
done

echo "[5/5] plan (not applied)"
railway config plan || true

echo
echo "Remaining for $ENV:"
# ${arr[@]+...} keeps an empty array safe under set -u on macOS bash 3.2.
for KEY in ${MISSING[@]+"${MISSING[@]}"}; do echo "  [ ] $KEY: add to 1Password, re-run under op run"; done
[[ "$ENV" == production ]] && echo "  [ ] STORE_MODE=live on api, worker, scheduler (deliberate; never copied)"
echo "  [ ] SMTP_HOST / SMTP_PORT / SMTP_FROM until email moves to the relay"
echo "  [ ] Review the plan above, then: railway config apply"
echo "  [ ] Smoke test: curl $API_URL/health  (expect env=$ENV)"
