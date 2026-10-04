# escalating-reminders

<!-- agent-playbook -->
## Efficient generation

This is an existing product. Do not farm a new repo for work that belongs here.

- `bc-…` → resume that agent. Never a second job.
- New fix → `@CloudAgents` if this repo is Slack-wired, else a branch + PR. Composer 2.5, Fast off.
- New independent app → `/Users/admin/Dev/YOLOProjects/cloud-agents`.

Never: Opus/GPT, Fast on, `ANTHROPIC_API_KEY` in the shell, extra Max usage, re-farming a failed `bc-` job.

## Close

Last lines of every job are COST: this run, this project total, today. If cents are unknown, write `COST this run: unknown`.
<!-- /agent-playbook -->

## Noctusoft platforms

This product does not sign up for OpenAI, Twilio, or SendGrid. It calls two Noctusoft platforms. The product id is the only difference.

- **LLM Relay** — OpenAI-compatible API at `https://ai.noctusoft.com/v1` on litellm-vm (Azure `20.46.250.159`, Tailscale `100.112.233.46`). Virtual key. No provider SDK. Not noctusoft-relay on `ns`.
- **Mail** — `POST /email/send` or SendGrid drop-in `POST /v3/mail/send` on `api.sendgrid.noctusoft.com`, with the product key and `X-App-Env` (`dev` captures in smtp4dev, `uat` tags and sends, anything else is real delivery).
- **Text** — `POST /sms/send` or Twilio drop-in on `api.twilio.noctusoft.com`.
- **One store** — the product's billing alias on noctusoft-relay. Square item codes are `NOCTU-{PRODUCT}-…`. The Square category is `Noctusoft — {brand}`.
- **Marketplace** — Connect Hub, the FieldView shape: `POST /connect/{productKey}/recipients/{seller}/charge`. The seller is the merchant. The fee lives on that product's `connect_apps` row.
