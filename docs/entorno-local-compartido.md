# Levantar el entorno local con la base de catálogo compartida

Para que dos integrantes trabajen con **el mismo catálogo** (mismos ids de producto, fotos, nombres en español, precios en pesos, complementarios y cupón `LEALTAD10`), uno exporta la base y el otro la restaura en su Docker. No se vuelve a sembrar: la siembra usa datos aleatorios y cada persona obtendría productos distintos.

## Qué trae el archivo `comproya_catalogo_AAAA-MM-DD.sql`

- La estructura completa de la base (las 20 tablas) y las 9 migraciones de Prisma ya aplicadas.
- Los datos de **catálogo y configuración**: productos (2117, de los cuales 2115 publicados y con foto), categorías (26), sucursales (9), inventario por sucursal (19053), productos complementarios (8460) y el cupón de lealtad `LEALTAD10`.
- **No trae** cuentas, carritos, pedidos, pagos ni auditoría: cada persona crea las suyas. Así no viajan datos de las pruebas de otra persona.

El archivo **no se sube al repositorio** (es público): está en `.gitignore` y se comparte por otro canal (Drive, Teams o WhatsApp). Pesa 1,3 MB.

## Pasos de quien recibe la base

Requisitos: Docker Desktop abierto, Node 22 y Git.

```bash
git checkout main
git pull
docker compose up -d db
```

Pon el archivo `.sql` en la **raíz del repositorio** y restaura la base. El comando depende de la terminal:

```powershell
# PowerShell o CMD
cmd /c "docker compose exec -T db psql -U postgres -d comproya -v ON_ERROR_STOP=1 < comproya_catalogo_2026-10-09.sql"
```

```bash
# Git Bash
docker compose exec -T db psql -U postgres -d comproya -v ON_ERROR_STOP=1 < comproya_catalogo_2026-10-09.sql
```

Es seguro repetirlo: el archivo borra y vuelve a crear las tablas. **No ejecutes `npm run seed`** después de restaurar: duplicaría el catálogo con productos aleatorios.

Comprobar que quedó bien:

```bash
docker compose exec -T db psql -U postgres -d comproya -c "select count(*) from products"   # 2117
```

## Backend y frontend

```bash
cd backend
cp .env.example .env        # en PowerShell: Copy-Item .env.example .env
```

Completa `backend/.env` (el archivo `.env` no se sube a Git; no pegues estos valores en el chat ni en el repositorio):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:comproya@localhost:5433/comproya` |
| `JWT_SECRET`, `DEBITO_NOTIFICATION_SECRET`, `PAYMENT_TOKEN_ENCRYPTION_KEY` | cualquier texto largo y aleatorio, por ejemplo la salida de `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `FRONTEND_ORIGIN` | `http://localhost:3000` |
| `PORT` | `3001` |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | las llaves de **modo de prueba** de la cuenta de Stripe del equipo (panel de Stripe, con «Test mode» activado). Se pasan por un canal privado. |
| `STRIPE_WEBHOOK_SECRET` | el `whsec_…` que imprime `stripe listen` (ver abajo) |

```bash
npm install
npx prisma generate
npx prisma migrate status     # debe decir que la base está al día
npm run start:dev             # http://localhost:3001/api
```

En otra terminal:

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm install
npm run dev                   # http://localhost:3000
```

Para que un pedido pase a «Pagado» hace falta que Stripe avise al backend. En una tercera terminal:

```bash
stripe listen --forward-to http://localhost:3001/api/pagos/webhook/stripe
```

Copia el `whsec_…` que imprime a `STRIPE_WEBHOOK_SECRET` y reinicia el backend. En la pasarela de prueba se usa la tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier código.

## Verificación rápida

- `http://localhost:3001/api/catalogo/categorias` devuelve 26 categorías.
- `http://localhost:3000` muestra el catálogo con fotos y precios en pesos.
- Se puede crear una cuenta, agregar un producto, aplicar `LEALTAD10` y llegar a la pasarela de pago.

## Quien exporta la base (cómo se generó)

```bash
# Git Bash, desde la raíz del repositorio; la base debe estar en marcha
docker compose exec -T db pg_dump -U postgres -d comproya --no-owner --no-privileges --clean --if-exists \
  --exclude-table-data=carts --exclude-table-data=cart_items --exclude-table-data=customers \
  --exclude-table-data=consents --exclude-table-data=audit_log --exclude-table-data=order_status_history \
  --exclude-table-data=units_reservations --exclude-table-data=order_items --exclude-table-data=orders \
  --exclude-table-data=payments --exclude-table-data=coupon_redemptions --exclude-table-data=deletion_requests \
  --exclude-table-data=behavior_events > comproya_catalogo_AAAA-MM-DD.sql
```

Si se agrega una tabla de datos de usuario, hay que sumarla a la lista de exclusión antes de compartir.

## Problemas frecuentes

- **`Falta PAYMENT_TOKEN_ENCRYPTION_KEY` o `DEBITO_NOTIFICATION_SECRET`:** faltan en `backend/.env`.
- **El pago nunca pasa a «Pagado»:** `stripe listen` no está corriendo o el `whsec_…` del `.env` no es el que imprimió.
- **Git Bash cambia las rutas que empiezan por `/`:** usa los comandos de arriba o antepón `MSYS_NO_PATHCONV=1`.
- **El puerto 5433 está ocupado:** hay otra base en ese puerto; detenla o cambia el puerto en `docker-compose.yml` y en `DATABASE_URL`.
