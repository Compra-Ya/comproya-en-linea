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

Nunca en variables de entorno planas en el repositorio. `DATABASE_URL`, las llaves de Stripe (sandbox) y el secreto de firma de JWT van en Secret Manager:

```bash
echo -n "postgresql://..." | gcloud secrets create database-url --data-file=-
echo -n "sk_test_..." | gcloud secrets create stripe-secret-key --data-file=-
echo -n "<jwt-secret-aleatorio>" | gcloud secrets create jwt-secret --data-file=-
```

## 6. Despliegue manual (primera vez, para validar que todo corre)

```bash
# Backend
gcloud builds submit backend/ \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/comproya/backend:manual

gcloud run deploy comproya-backend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/comproya/backend:manual \
  --region $REGION \
  --set-secrets DATABASE_URL=database-url:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,JWT_SECRET=jwt-secret:latest \
  --allow-unauthenticated

# Frontend
gcloud builds submit frontend/ \
  --tag $REGION-docker.pkg.dev/$PROJECT_ID/comproya/frontend:manual

gcloud run deploy comproya-frontend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/comproya/frontend:manual \
  --region $REGION \
  --allow-unauthenticated
```

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
- `GCP_SA_KEY` (llave JSON de una cuenta de servicio con roles `roles/run.admin`, `roles/artifactregistry.writer` y `roles/iam.serviceAccountUser`)
- `DATABASE_URL` (la misma cadena de conexión de Cloud SQL, para que el workflow pueda correr `prisma migrate deploy` antes de desplegar)

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

gcloud iam service-accounts keys create key.json \
  --iam-account=comproya-deploy@$PROJECT_ID.iam.gserviceaccount.com
# El contenido de key.json va al secret GCP_SA_KEY en GitHub — nunca se commitea.
```

## 9. Decisiones que hay que revisar

- Se asumió `us-central1` como región — cualquier región de GCP sirve, pero conviene fijar una sola para Cloud Run, Cloud SQL y Artifact Registry, porque el tráfico entre regiones distintas sí introduce latencia innecesaria.
- Se asumió GitHub como el repositorio remoto (el workflow es de GitHub Actions); si el repositorio termina en otro proveedor, solo cambia el archivo `.github/workflows/deploy.yml` por el equivalente de esa plataforma, no la infraestructura de GCP.
- No se creó todavía un dominio propio ni certificado — Cloud Run da una URL `*.run.app` válida por HTTPS desde el primer despliegue, suficiente para todo el desarrollo y la sustentación.
