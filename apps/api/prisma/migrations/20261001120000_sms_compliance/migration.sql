-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- AlterTable
ALTER TABLE "trusted_contacts" ALTER COLUMN "notification_preferences" SET DEFAULT '{"email": true, "sms": false}';

-- CreateEnum
CREATE TYPE "SmsMessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateTable
CREATE TABLE "sms_consents" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "consent_text_version" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "consented_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_message_logs" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "direction" "SmsMessageDirection" NOT NULL DEFAULT 'OUTBOUND',
    "relay_http_status" INTEGER,
    "relay_error_code" INTEGER,
    "relay_error_message" TEXT,
    "twilio_message_sid" TEXT,
    "message_status" TEXT,
    "error_code" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_consents_phone_idx" ON "sms_consents"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "sms_consents_phone_purpose_key" ON "sms_consents"("phone", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "sms_message_logs_twilio_message_sid_key" ON "sms_message_logs"("twilio_message_sid");

-- CreateIndex
CREATE INDEX "sms_message_logs_phone_idx" ON "sms_message_logs"("phone");
