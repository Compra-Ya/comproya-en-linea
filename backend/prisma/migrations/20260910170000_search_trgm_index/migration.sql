-- CU-02 Búsqueda de productos. Sostiene el umbral del canon (P95 <= 1,5 s
-- con hasta 40.000 productos publicados) para búsquedas por coincidencia
-- parcial de nombre (docs/arquitectura.md sección 10).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
