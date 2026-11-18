# Despliegue en Google Cloud — ComproYa en Línea

Este documento da los pasos concretos para levantar la infraestructura descrita en `docs/arquitectura.md` (sección 9) y dejar un pipeline de despliegue continuo funcionando desde la Fase 0 del plan de trabajo, antes de escribir el primer caso de uso.

Con el tráfico pico documentado en el canon (900 pedidos por hora, es decir 0,25 pedidos por segundo), todo este despliegue cabe cómodamente en el nivel de uso más bajo de cada servicio — vale la pena confirmar cuotas gratuitas vigentes en la consola de GCP antes de asumir costo cero, porque cambian con el tiempo.

## 1. Bootstrap del proyecto de GCP

```bash
# Variables que se reutilizan en el resto de comandos
export PROJECT_ID="comproya-en-linea"
export REGION="us-central1"

gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID

# Habilitar los servicios que usa la arquitectura
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudtasks.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com
```

## 2. Base de datos — Cloud SQL (PostgreSQL)

```bash
gcloud sql instances create comproya-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-size=10GB

gcloud sql databases create comproya --instance=comproya-db

gcloud sql users set-password postgres \
  --instance=comproya-db \
  --password="<definir con gcloud secrets, no a mano>"
```

`db-f1-micro` alcanza de sobra para el tráfico del canon; si las pruebas de carga de búsqueda (P95 ≤ 1,5 s con 40.000 productos, sección 10 del canon) no lo cumplen con esta instancia, el siguiente paso es subir de tier antes de tocar la arquitectura.

## 3. Artifact Registry (imágenes de contenedor)

```bash
gcloud artifacts repositories create comproya \
  --repository-format=docker \
  --location=$REGION
```

## 4. Cloud Storage (imágenes de producto y comprobantes)

```bash
gcloud storage buckets create gs://$PROJECT_ID-assets --location=$REGION
```

Como se explica en `docs/arquitectura.md` sección 5, este bucket no es indispensable en el sprint 1 — se puede crear cuando el módulo `catalogo` deje de depender de las URLs de imagen externas de DummyJSON.

## 5. Secretos

Nunca en variables de entorno planas en el repositorio. Todo lo sensible va en Secret Manager (los nombres de variable son los de `backend/.env.example`):

```bash
# DATABASE_URL de Cloud Run: por el socket de Cloud SQL (nombre de conexión: PROYECTO:REGION:comproya-db)
echo -n "postgresql://postgres:<clave>@localhost/comproya?host=/cloudsql/$PROJECT_ID:$REGION:comproya-db" | gcloud secrets create database-url --data-file=-
echo -n "sk_test_..." | gcloud secrets create stripe-secret-key --data-file=-
echo -n "whsec_..." | gcloud secrets create stripe-webhook-secret --data-file=-
echo -n "<secreto-aleatorio>" | gcloud secrets create jwt-secret --data-file=-
echo -n "<secreto-aleatorio>" | gcloud secrets create debito-notification-secret --data-file=-
echo -n "<clave-de-cifrado>" | gcloud secrets create payment-token-encryption-key --data-file=-
```

`PAYMENT_TOKEN_ENCRYPTION_KEY` cifra en reposo el identificador de la pasarela; el formato que acepta está en `backend/.env.example`.

## 6. Despliegue manual (primera vez, para validar que todo corre)

El primer despliegue se hace a mano porque fija la configuración del servicio (secretos, conexión a Cloud SQL, variables). Los siguientes los hace el workflow cambiando solo la imagen, y Cloud Run conserva esa configuración.

```bash
# Backend. El frontend todavía no existe: FRONTEND_ORIGIN se corrige más abajo.
gcloud builds submit backend/ \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/comproya/backend:manual

gcloud run deploy comproya-backend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/comproya/backend:manual \
  --region $REGION \
  --add-cloudsql-instances $PROJECT_ID:$REGION:comproya-db \
  --set-env-vars FRONTEND_ORIGIN=http://localhost:3000,JOBS_ENABLED=true \
  --set-secrets DATABASE_URL=database-url:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,JWT_SECRET=jwt-secret:latest,DEBITO_NOTIFICATION_SECRET=debito-notification-secret:latest,PAYMENT_TOKEN_ENCRYPTION_KEY=payment-token-encryption-key:latest \
  --allow-unauthenticated

# Migraciones y datos iniciales de la base desplegada: ver design/plan-ejecucion-bd-desplegada.md

# Frontend. La URL del backend se incrusta al compilar (NEXT_PUBLIC_API_URL), por eso se usa cloudbuild.yaml.
BACKEND_URL=$(gcloud run services describe comproya-backend --region $REGION --format 'value(status.url)')
gcloud builds submit frontend/ \
  --config frontend/cloudbuild.yaml \
  --substitutions _API_URL=$BACKEND_URL/api,_IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/comproya/frontend:manual

gcloud run deploy comproya-frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/comproya/frontend:manual \
  --region $REGION \
  --allow-unauthenticated

# Con el frontend ya creado, el backend debe aceptar su origen (CORS y URLs de retorno de Stripe).
FRONTEND_URL=$(gcloud run services describe comproya-frontend --region $REGION --format 'value(status.url)')
gcloud run services update comproya-backend --region $REGION --set-env-vars FRONTEND_ORIGIN=$FRONTEND_URL
```

El webhook de Stripe (modo de prueba) debe apuntar al backend desplegado; la ruta exacta está en `backend/src/pago/pago.controller.ts`.

Los trabajos programados del backend (`SupresionJob` y `LiberacionReservasJob`, con `@Cron`) corren dentro del propio proceso. Cloud Run reduce a cero las instancias sin tráfico y limita la CPU entre solicitudes, así que esos trabajos solo corren de forma fiable con `--min-instances=1 --no-cpu-throttling` (con costo) o si se llaman desde Cloud Scheduler (sección 7).

## 7. Cloud Scheduler (jobs periódicos de la sección 8 de arquitectura.md)

```bash
gcloud scheduler jobs create http sincronizar-erp \
  --schedule="*/5 * * * *" \
  --uri="$(gcloud run services describe comproya-backend --region $REGION --format 'value(status.url)')/interno/sincronizar-erp" \
  --http-method=POST \
  --location=$REGION

gcloud scheduler jobs create http expirar-reservas \
  --schedule="*/5 * * * *" \
  --uri="$(gcloud run services describe comproya-backend --region $REGION --format 'value(status.url)')/interno/expirar-reservas" \
  --http-method=POST \
  --location=$REGION

gcloud scheduler jobs create http pedidos-en-riesgo \
  --schedule="*/30 * * * *" \
  --uri="$(gcloud run services describe comproya-backend --region $REGION --format 'value(status.url)')/interno/pedidos-en-riesgo" \
  --http-method=POST \
  --location=$REGION
```

Estos tres endpoints (`/interno/...`) deben quedar protegidos con el header que agrega Cloud Scheduler (OIDC), no con `--allow-unauthenticated` — es la única parte del backend que no debe ser pública.

## 8. Despliegue continuo — GitHub Actions

A partir de aquí, cada `push` a `main` reconstruye y despliega ambos servicios. El workflow ya está en `.github/workflows/deploy.yml`; solo falta configurar en el repositorio de GitHub (Settings → Secrets → Actions) las credenciales:

- `GCP_PROJECT_ID`
- `GCP_SA_KEY` (llave JSON de una cuenta de servicio con roles `roles/run.admin`, `roles/artifactregistry.writer`, `roles/iam.serviceAccountUser` y `roles/cloudsql.client`)
- `CLOUD_SQL_CONNECTION_NAME` (`PROYECTO:REGION:comproya-db`; con él el workflow abre un túnel con el proxy de Cloud SQL)
- `DATABASE_URL` (cadena para correr `prisma migrate deploy` desde el workflow a través del túnel: `postgresql://postgres:<clave>@127.0.0.1:5432/comproya`; no es la que usa Cloud Run en Secret Manager)

```bash
gcloud iam service-accounts create comproya-deploy \
  --display-name="ComproYa CI/CD"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:comproya-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:comproya-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:comproya-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:comproya-deploy@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud iam service-accounts keys create key.json \
  --iam-account=comproya-deploy@$PROJECT_ID.iam.gserviceaccount.com
# El contenido de key.json va al secret GCP_SA_KEY en GitHub — nunca se commitea.
```

## 9. Decisiones que hay que revisar

- Se asumió `us-central1` como región — cualquier región de GCP sirve, pero conviene fijar una sola para Cloud Run, Cloud SQL y Artifact Registry, porque el tráfico entre regiones distintas sí introduce latencia innecesaria.
- Se asumió GitHub como el repositorio remoto (el workflow es de GitHub Actions); si el repositorio termina en otro proveedor, solo cambia el archivo `.github/workflows/deploy.yml` por el equivalente de esa plataforma, no la infraestructura de GCP.
- No se creó todavía un dominio propio ni certificado — Cloud Run da una URL `*.run.app` válida por HTTPS desde el primer despliegue, suficiente para todo el desarrollo y la sustentación.
