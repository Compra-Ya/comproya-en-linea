-- La migración anterior (add_product_image_url) tuvo un efecto secundario no
-- intencional: `prisma migrate dev` recalculó el diff contra schema.prisma
-- (que no puede declarar un índice GIN de trigramas sin previewFeatures) y
-- eliminó "products_name_trgm_idx" creado en 20260910170000_search_trgm_index
-- para CU-02 (búsqueda, P95 <= 1,5 s). Esta migración lo restaura.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
