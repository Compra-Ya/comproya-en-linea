-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('CHANNEL_COORDINATOR');

-- CreateTable
CREATE TABLE "staff_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'CHANNEL_COORDINATOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_key" ON "staff_users"("email");
