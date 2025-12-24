-- CreateEnum
CREATE TYPE "DeliveryState" AS ENUM ('ACTIVE', 'DELIVERY_DISABLED', 'USAGE_SUSPENDED');

-- AlterTable
ALTER TABLE "subscriptions"
ADD COLUMN     "delivery_state" "DeliveryState" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "delivery_disabled_at" TIMESTAMP(3),
ADD COLUMN     "delivery_disabled_by" TEXT,
ADD COLUMN     "delivery_disabled_reason" TEXT,
ADD COLUMN     "usage_suspended_at" TIMESTAMP(3),
ADD COLUMN     "usage_suspended_until" TIMESTAMP(3),
ADD COLUMN     "usage_suspension_reason" TEXT;

-- CreateTable
CREATE TABLE "delivery_window_usage" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_window_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_window_usage_user_id_window_start_key" ON "delivery_window_usage"("user_id", "window_start");

-- CreateIndex
CREATE INDEX "delivery_window_usage_user_id_window_start_idx" ON "delivery_window_usage"("user_id", "window_start");
