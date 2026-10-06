#!/usr/bin/env bash
# apply-rulesets.sh
#
# Idempotently applies GitHub branch rulesets from ops/github/rulesets/*.json
# via the GitHub API. Rulesets are authored with "enforcement": "disabled" so
# they take effect without blocking anything until manually flipped to "active".
#
# Usage:
#   ./ops/github/apply-rulesets.sh [--active]
#
# Flags:
#   --active   Override enforcement to "active" for all rulesets (once dev, uat, and production are deployed)
#
# Requirements:
#   gh CLI authenticated with repo admin scope
#
set -euo pipefail

REPO="YOLOVibeCode/escalating-reminders"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/rulesets"
ACTIVE_OVERRIDE=false

if [[ "${1:-}" == "--active" ]]; then
  ACTIVE_OVERRIDE=true
  echo "⚡ --active flag: enforcement will be set to 'active' for all rulesets"
fi

echo "Applying GitHub branch rulesets to $REPO ..."
echo

# Get existing rulesets
EXISTING_JSON=$(gh api "/repos/$REPO/rulesets" --paginate 2>/dev/null || echo "[]")

for FILE in "$DIR"/*.json; do
  [[ -f "$FILE" ]] || continue
  NAME=$(python3 -c "import json,sys; print(json.load(open('$FILE'))['name'])" 2>/dev/null)
  [[ -z "$NAME" ]] && continue

  # Apply active override if requested
  PAYLOAD=$(cat "$FILE")
  if $ACTIVE_OVERRIDE; then
    PAYLOAD=$(echo "$PAYLOAD" | python3 -c "
import json,sys
d=json.load(sys.stdin)
# Remove internal _comment fields (GitHub API rejects unknown keys)
d.pop('_comment', None)
d['enforcement'] = 'active'
print(json.dumps(d))
")
  else
    PAYLOAD=$(echo "$PAYLOAD" | python3 -c "
import json,sys
d=json.load(sys.stdin)
d.pop('_comment', None)
print(json.dumps(d))
")
  fi

  # Check if ruleset with this name already exists
  EXISTING_ID=$(echo "$EXISTING_JSON" | python3 -c "
import json,sys
rulesets=json.load(sys.stdin)
match=[r['id'] for r in rulesets if r['name']=='$NAME']
print(match[0] if match else '')
" 2>/dev/null || echo "")

  if [[ -n "$EXISTING_ID" ]]; then
    echo "  UPDATE [$NAME] (id=$EXISTING_ID)"
    echo "$PAYLOAD" | gh api "/repos/$REPO/rulesets/$EXISTING_ID" \
      --method PUT \
      --input - \
      --jq '.id,.name,.enforcement' \
      2>&1 | sed 's/^/    /'
  else
    echo "  CREATE [$NAME]"
    echo "$PAYLOAD" | gh api "/repos/$REPO/rulesets" \
      --method POST \
      --input - \
      --jq '.id,.name,.enforcement' \
      2>&1 | sed 's/^/    /'
  fi
done

echo
echo "✓ Rulesets applied."
echo
if ! $ACTIVE_OVERRIDE; then
  echo "  All rulesets were applied with enforcement=disabled (or whatever"
  echo "  their JSON says). To flip them active, re-run with --active:"
  echo "    ./ops/github/apply-rulesets.sh --active"
fi
