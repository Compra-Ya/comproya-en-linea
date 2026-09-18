-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDIENTE', 'ACTIVO', 'REVOCADO', 'SUPRIMIDO');

-- DropIndex
DROP INDEX "products_name_trgm_idx";

-- AlterTable
ALTER TABLE "consents" ADD COLUMN     "status" "ConsentStatus" NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "image_url" TEXT;
