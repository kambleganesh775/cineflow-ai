#!/usr/bin/env bash
# ==============================================================================
# CineFlow AI — Google Cloud Run Deployment Script (Strictly Private Setup)
# ==============================================================================

set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-promptwars-494613}"
REGION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
STORAGE_BUCKET="${GOOGLE_CLOUD_STORAGE_BUCKET:-cineflow-ai-private-videos-promptwars-494613}"
OWNER_EMAIL="${AUTHORIZED_OWNER_EMAIL:-official.topanalytica@gmail.com}"

echo "=========================================================="
echo "🎬 Deploying CineFlow AI Private Video Studio to Cloud Run"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "Strict Owner: $OWNER_EMAIL"
echo "=========================================================="

# 1. Enable Required Google Cloud APIs
echo "[1/5] Checking required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com \
  iap.googleapis.com \
  artifactregistry.googleapis.com \
  --project="$PROJECT_ID"

# 2. Create Private Cloud Storage Bucket (if not exists)
echo "[2/5] Creating private Cloud Storage bucket..."
if ! gsutil ls -b "gs://$STORAGE_BUCKET" >/dev/null 2>&1; then
  gsutil mb -p "$PROJECT_ID" -c standard -l "$REGION" -b on "gs://$STORAGE_BUCKET"
  # Enforce Uniform Bucket-Level Access (prevents public ACLs)
  gsutil uniformbucketlevelaccess set on "gs://$STORAGE_BUCKET"
  echo "Created private bucket gs://$STORAGE_BUCKET with uniform access."
else
  echo "Bucket gs://$STORAGE_BUCKET already exists."
fi

# 3. Dedicated Service Account with Least Privilege
echo "[3/5] Configuring dedicated Cloud Run service account..."
SA_NAME="cineflow-runner"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="CineFlow AI Cloud Run Service Account" \
    --project="$PROJECT_ID"
fi

# Grant least-privilege roles to service account:
# - roles/aiplatform.user (to call Veo predictLongRunning)
# - roles/storage.objectAdmin (to read/write project video clips)
# - roles/datastore.user (to read/write Firestore project/scene documents)
echo "Granting least-privilege IAM roles to $SA_EMAIL..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.objectAdmin" >/dev/null

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/datastore.user" >/dev/null

# 4. Deploy API Service to Cloud Run (Private ingress only or authenticated invocations)
echo "[4/5] Deploying API Service to Cloud Run..."
gcloud run deploy cineflow-api \
  --source=. \
  --dockerfile=infrastructure/cloudrun/Dockerfile.api \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="$SA_EMAIL" \
  --no-allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION,GOOGLE_CLOUD_STORAGE_BUCKET=$STORAGE_BUCKET,AUTHORIZED_OWNER_EMAIL=$OWNER_EMAIL,AUTH_MODE=google_iap"

# 5. Summary
echo "=========================================================="
echo "✅ CineFlow AI Deployment Complete!"
echo "Next step: Configure Identity-Aware Proxy (IAP) on your Load Balancer"
echo "and grant roles/iap.httpsResourceAccessor strictly to $OWNER_EMAIL."
echo "See docs/GOOGLE_CLOUD_DEPLOYMENT.md for step-by-step verification."
echo "=========================================================="
