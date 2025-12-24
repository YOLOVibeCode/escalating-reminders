-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('GOOGLE', 'GITHUB', 'MICROSOFT');

-- AlterTable: Make password_hash nullable for OAuth users
ALTER TABLE "users" 
ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable: Add OAuth fields
ALTER TABLE "users" 
ADD COLUMN "oauth_provider" "OAuthProvider",
ADD COLUMN "oauth_provider_id" TEXT;

-- CreateIndex: Add unique constraint on OAuth provider + provider ID
-- This allows multiple NULL values but enforces uniqueness for non-NULL combinations
CREATE UNIQUE INDEX "users_oauth_provider_oauth_provider_id_key" ON "users"("oauth_provider", "oauth_provider_id");
