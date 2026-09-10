-- AlterTable
ALTER TABLE "carts" ADD COLUMN "guest_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "carts_guest_token_key" ON "carts"("guest_token");
