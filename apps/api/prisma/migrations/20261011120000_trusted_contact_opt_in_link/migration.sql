-- AlterTable
ALTER TABLE "trusted_contacts" ADD COLUMN "sms_opt_in_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "trusted_contacts_sms_opt_in_token_key" ON "trusted_contacts"("sms_opt_in_token");

-- Consent is now per trusted contact (purpose 'trusted-contact:<id>'). Carry over YES replies
-- already given to the legacy "Reply YES" request, for the contacts of the user who sent it.
INSERT INTO "sms_consents" ("id", "phone", "purpose", "consent_text_version", "source", "ip", "user_agent", "consented_at", "revoked_at", "created_at", "updated_at")
SELECT gen_random_uuid()::text, c."phone", 'trusted-contact:' || tc."id", c."consent_text_version", 'reply-yes', c."ip", c."user_agent", c."consented_at", NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "sms_consents" c
JOIN "trusted_contacts" tc ON tc."phone" = c."phone"
WHERE c."purpose" = 'reminders you set and their escalations'
  AND c."source" = 'reply-yes'
  AND c."consented_at" IS NOT NULL
  AND c."revoked_at" IS NULL
  AND EXISTS (
    SELECT 1 FROM "sms_message_logs" l
    WHERE l."phone" = c."phone"
      AND l."direction" = 'OUTBOUND'
      AND l."metadata"->>'type' = 'trusted-contact-confirmation'
      AND l."metadata"->>'userId' = tc."user_id"
  )
ON CONFLICT ("phone", "purpose") DO NOTHING;
