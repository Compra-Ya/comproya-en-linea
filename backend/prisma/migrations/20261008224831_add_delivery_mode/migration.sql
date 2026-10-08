-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('PICKUP', 'SHIPPING');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'PICKUP',
ADD COLUMN     "shipping_address" TEXT,
ADD COLUMN     "shipping_city" TEXT,
ADD COLUMN     "shipping_name" TEXT,
ADD COLUMN     "shipping_notes" TEXT,
ADD COLUMN     "shipping_phone" TEXT;
