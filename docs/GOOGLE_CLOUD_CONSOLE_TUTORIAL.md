# Google Cloud Console — Step-by-Step Setup Guide

This tutorial explains exactly what to do inside the **[Google Cloud Console](https://console.cloud.google.com/)** to set up CineFlow AI with Google Cloud Vertex AI Veo and your $300 free trial credits.

---

## 📋 Overview of What We Will Do
1. [Create or Select a Google Cloud Project & Find Project ID](#1-create-or-select-a-project)
2. [Verify Your $300 Free Trial Credits & Expiry Date](#2-verify-free-trial-credits)
3. [Enable Required Google Cloud APIs](#3-enable-required-apis)
4. [Create a Private Cloud Storage Bucket](#4-create-a-private-cloud-storage-bucket)
5. [Initialize Cloud Firestore Database](#5-initialize-cloud-firestore)
6. [Check Vertex AI Veo Model Access & Quotas](#6-check-vertex-ai-veo-quota)
7. [Set Up a Budget Alert (Spending Protection)](#7-set-up-a-budget-alert)
8. [Put the Values in Your `.env` File](#8-put-the-values-in-your-env-file)

---

## 1. Create or Select a Project

1. Go to **[https://console.cloud.google.com/](https://console.cloud.google.com/)**.
2. Sign in with your Google Account.
3. At the top left (next to the "Google Cloud" logo), click the **Project Dropdown**.
4. Click **New Project** (or select an existing project).
5. Give it a name (e.g., `cineflow-studio`).
6. Notice the **Project ID** underneath the project name (e.g., `cineflow-studio-123456`).
   > 📌 **Save this Project ID!** You will need to put it into your `.env` file as `GOOGLE_CLOUD_PROJECT`.

---

## 2. Verify Free Trial Credits

To ensure you don't get charged unexpectedly and your $300 credits are active:

1. In the search bar at the top, type **Billing** and press Enter (or go to [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)).
2. Click **Overview** in the left sidebar.
3. Look at the **Credits** section on the dashboard:
   - Check the **Remaining Credit Amount** (e.g., `~$300.00`).
   - Click on **Promotional Credits** to view the **Expiration Date** (credits typically expire after 90 days).
   - Verify that your Project is linked to this active Billing Account.

---

## 3. Enable Required APIs

CineFlow AI needs 4 Google Cloud APIs enabled to generate videos, store clips, and manage projects.

You can enable them in **one click** via the search bar or run this command in terminal:

```bash
gcloud services enable \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com \
  run.googleapis.com
```

### Alternatively, enable them manually in the Console:
1. Search for **APIs & Services** > **Library** ([https://console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)).
2. Search and click **Enable** for each of these:
   - **Vertex AI API** (`aiplatform.googleapis.com`) — *Required for Veo video generation*
   - **Cloud Storage API** (`storage.googleapis.com`) — *Required for storing video clips*
   - **Cloud Firestore API** (`firestore.googleapis.com`) — *Required for database persistence*
   - **Cloud Run Admin API** (`run.googleapis.com`) — *Required if deploying to the cloud*

---

## 4. Create a Private Cloud Storage Bucket

All generated clips are stored privately in a Google Cloud Storage bucket and served only via expiring signed URLs.

1. Go to **Cloud Storage** > **Buckets** ([https://console.cloud.google.com/storage/browser](https://console.cloud.google.com/storage/browser)).
2. Click **+ Create** at the top.
3. Configure the bucket:
   - **Name your bucket**: `cineflow-ai-private-videos-[your-project-id]` (must be globally unique, all lowercase).
   - **Location type**: Choose `Region`.
   - **Location**: Select `us-central1 (Iowa)` (this matches the Vertex AI Veo region for ultra-fast generation transfers).
   - **Default storage class**: `Standard`.
   - **Prevent public access**: ✅ **Check "Enforce public access prevention on this bucket"**.
   - **Access control**: ✅ Select **Uniform** (ensures no accidental public leaks).
4. Click **Create**.

---

## 5. Initialize Cloud Firestore

Firestore stores your projects, scenes, and generation history.

1. In the top search bar, search for **Firestore** ([https://console.cloud.google.com/firestore](https://console.cloud.google.com/firestore)).
2. If this is your first time, click **Create Database**.
3. Configure:
   - **Database mode**: Select **Native Mode** (Recommended).
   - **Database ID**: `(default)`.
   - **Location**: Select `nam5 (United States)` or `us-central1`.
   - **Secure rules**: Select **Start in production mode** (our `infrastructure/firestore/firestore.rules` will automatically protect it).
4. Click **Create Database**.

---

## 6. Check Vertex AI Veo Quota

1. In the search bar, search for **Vertex AI** > **Model Garden** ([https://console.cloud.google.com/vertex-ai/model-garden](https://console.cloud.google.com/vertex-ai/model-garden)).
2. Search for **Veo** or **veo-2.0-generate-001**.
3. Click on the model card to confirm it is available in your project's region (`us-central1`).
4. To check quota limits:
   - Go to **IAM & Admin** > **Quotas** ([https://console.cloud.google.com/iam-admin/quotas](https://console.cloud.google.com/iam-admin/quotas)).
   - Filter by Service: `Vertex AI API`.
   - Verify that you have quota for video generation requests.

---

## 7. Set Up a Budget Alert

To guarantee you never exceed your credits or budget:

1. Go to **Billing** > **Budgets & alerts** ([https://console.cloud.google.com/billing/budgets](https://console.cloud.google.com/billing/budgets)).
2. Click **+ Create Budget**.
3. **Scope**: Select your Project.
4. **Amount**: Set a budget (e.g., `$20.00` or `$50.00`).
5. **Actions**: Check **Email alerts to billing admins**.
6. Click **Finish**. Google will instantly email you if spending reaches 50%, 90%, or 100% of your target.

---

## 8. Put the Values in Your `.env` File

Now that your Google Cloud Console setup is complete, open your local `.env` file in `c:\Users\HP\OneDrive\Desktop\cineflow-ai\.env` and fill in:

```env
# 1. Your Google Cloud Project ID from Step 1
GOOGLE_CLOUD_PROJECT=your-project-id-here

# 2. Location where you enabled Vertex AI
GOOGLE_CLOUD_LOCATION=us-central1

# 3. Bucket name you created in Step 4
GOOGLE_CLOUD_STORAGE_BUCKET=cineflow-ai-private-videos-your-project-id-here
FIREBASE_PROJECT_ID=your-project-id-here

# 4. Your Google email
AUTHORIZED_OWNER_EMAIL=your-google-email@gmail.com
AUTHORIZED_EMAILS=your-google-email@gmail.com

# 5. Model
VEO_MODEL_ID=veo-2.0-generate-001

# 6. Mode: Set to false to generate REAL videos with Veo
MOCK_VERTEX_AI=false
REQUIRE_BILLING_CONFIRMATION=true
```

Then in your terminal, authenticate once:
```powershell
gcloud auth application-default login
gcloud config set project your-project-id-here
```

Start the studio:
```powershell
npm run dev:api    # Terminal 1
npm run dev:web    # Terminal 2
```

And open **[http://localhost:3000](http://localhost:3000)**!
