# CineFlow AI — Google Cloud Production Deployment Guide

This guide describes how to deploy **CineFlow AI** to Google Cloud using a strictly private, single-owner architecture.

---

## 1. Architecture Overview

```
[Authorized User]
       │ (Google Account Authentication)
       ▼
[External Application Load Balancer]
       │
[Identity-Aware Proxy (IAP)] ──── (Restricts access exclusively to your-email@gmail.com)
       │
       ▼ (x-goog-iap-jwt-assertion verified)
[Google Cloud Run: CineFlow Web & API]
       │
       ├─► [Vertex AI Veo (predictLongRunning) & Omni Director]
       ├─► [Google Cloud Storage (Private Bucket, gs://...)]
       └─► [Google Cloud Firestore (Projects, Scenes, Jobs)]
```

---

## 2. Prerequisites

1. Set your active Google Cloud project:
```bash
gcloud config set project your-google-cloud-project-id
```
2. Ensure you have the `roles/owner` or `roles/resourcemanager.organizationAdmin` role to configure IAM policies.

---

## 3. Automated Deployment Script

Run the provided deployment script:
```bash
chmod +x infrastructure/cloudrun/deploy.sh
./infrastructure/cloudrun/deploy.sh
```

The script automatically:
1. Enables required APIs (`run`, `aiplatform`, `storage`, `firestore`, `iap`).
2. Creates the private Cloud Storage bucket with **Uniform Bucket-Level Access** enabled.
3. Provisions a dedicated least-privilege service account `cineflow-runner`.
4. Deploys the container to Cloud Run with unauthenticated access disabled (`--no-allow-unauthenticated`).

---

## 4. Configuring Identity-Aware Proxy (IAP)

To access your personal Cloud Run studio securely over the public web without making the service public:

1. Create an External HTTPS Load Balancer with a Serverless Network Endpoint Group (NEG) pointing to the `cineflow-api` and `cineflow-web` Cloud Run services.
2. In the Google Cloud Console, navigate to **Security > Identity-Aware Proxy**.
3. Locate the backend service associated with your Load Balancer.
4. Toggle the **IAP** switch to **ON**.
5. Select the backend service, click **Add Principal**:
   - **Principal**: `your-google-email@gmail.com`
   - **Role**: `roles/iap.httpsResourceAccessor` (IAP-secured Web App User)
6. **Result**: Anyone attempting to access the URL will be prompted to log in with Google. If the account does not match your authorized email, Google Cloud edge proxies immediately deny access with HTTP 403 before any request ever reaches your container.

---

## 5. Storage Security Verification

Verify that your Cloud Storage bucket has no public permissions:
```bash
gsutil iam get gs://cineflow-ai-private-videos-your-project-id
```
Ensure that `allUsers` and `allAuthenticatedUsers` are **NOT** present in the IAM policy. Videos can only be streamed or downloaded via short-lived signed URLs generated on-demand by your authenticated backend.
