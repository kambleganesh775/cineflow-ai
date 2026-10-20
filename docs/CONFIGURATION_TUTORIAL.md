# CineFlow AI — Complete Configuration & Setup Tutorial

Welcome to **CineFlow AI**, your private personal AI video studio powered by Google Cloud Vertex AI Veo.

This tutorial provides a complete step-by-step guide to configure, run, and customize this application from scratch on your machine.

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Get the Code & Install Dependencies](#step-1-get-the-code--install-dependencies)
3. [Step 2: Create & Configure Your `.env` File](#step-2-create--configure-your-env-file)
4. [Step 3: Connect Your Google Cloud Account](#step-3-connect-your-google-cloud-account)
5. [Step 4: Understand the Two Modes (Mock vs Real Generation)](#step-4-understand-the-two-modes-mock-vs-real-generation)
6. [Step 5: Start CineFlow AI Studio](#step-5-start-cineflow-ai-studio)
7. [Step 6: How to Generate Your First Video](#step-6-how-to-generate-your-first-video)
8. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 1. Prerequisites

Before starting, make sure the following free tools are installed on your computer:

| Tool | Minimum Version | Download Link | Check Installation |
| :--- | :--- | :--- | :--- |
| **Node.js** | v20.x or higher | [nodejs.org](https://nodejs.org/) | `node -v` |
| **npm** | v10.x or higher | Included with Node.js | `npm -v` |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com/) | `git --version` |
| **Google Cloud CLI (`gcloud`)** | Any recent version | [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install) | `gcloud --version` |

---

## Step 1: Get the Code & Install Dependencies

Open **PowerShell** or your terminal in the project directory:

```powershell
# Navigate to the project folder (if not already there)
cd c:\Users\HP\OneDrive\Desktop\cineflow-ai

# Install all monorepo dependencies across web, api, and shared packages
npm install
```

---

## Step 2: Create & Configure Your `.env` File

Copy the template configuration file `.env.example` to create your own active `.env` file:

```powershell
Copy-Item .env.example .env
```

Now open `.env` in your code editor. Here is what each setting means:

```env
# ==============================================================================
# 1. GOOGLE CLOUD CONFIGURATION
# ==============================================================================
# Replace with your actual Google Cloud Project ID (from console.cloud.google.com)
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id

# Location for Vertex AI Veo (default is us-central1)
GOOGLE_CLOUD_LOCATION=us-central1

# Name for your private Cloud Storage bucket (can be any unique name)
GOOGLE_CLOUD_STORAGE_BUCKET=cineflow-ai-private-videos-your-project-id

# Firebase project ID (typically the same as your GOOGLE_CLOUD_PROJECT)
FIREBASE_PROJECT_ID=your-google-cloud-project-id

# ==============================================================================
# 2. VEO MODEL CONFIGURATION
# ==============================================================================
# Available model IDs: veo-2.0-generate-001 (production), veo-3.0-generate-001
VEO_MODEL_ID=veo-2.0-generate-001

# ==============================================================================
# 3. YOUR AUTHORIZED GOOGLE ACCOUNT (ACCESS CONTROL)
# ==============================================================================
# Enter YOUR Google email address here.
# Anyone who uses this code can simply replace this with their own email.
AUTHORIZED_OWNER_EMAIL=your-email@gmail.com
AUTHORIZED_EMAILS=your-email@gmail.com

# Backend API URLs
API_PORT=4000
API_BASE_URL=http://localhost:4000
APP_BASE_URL=http://localhost:3000

# ==============================================================================
# 4. AUTHENTICATION MODE
# ==============================================================================
# Options:
# "local_dev"    -> Instant local access without login popups (recommended for dev)
# "google_oauth" -> Requires Google OAuth ID Token in headers
# "google_iap"   -> Uses Google Identity-Aware Proxy (for Cloud Run production)
AUTH_MODE=local_dev

# ==============================================================================
# 5. COST & SPENDING SAFEGUARDS
# ==============================================================================
# Maximum duration allowed per video scene (5 to 8 seconds)
MAX_SCENE_DURATION_SECONDS=8

# Require explicit confirmation popup before charging your Google Cloud account
REQUIRE_BILLING_CONFIRMATION=true

# MOCK MODE:
# If TRUE  -> Simulates video generation safely with ZERO Google Cloud charges ($0.00).
# If FALSE -> Calls real Google Vertex AI Veo APIs and deducts from trial credits/billing.
MOCK_VERTEX_AI=true
```

---

## Step 3: Connect Your Google Cloud Account

When you want to generate real videos with Google Veo, connect your local machine to your Google Cloud project:

### 1. Log in to Google Cloud CLI:
Run this command in your terminal:
```powershell
gcloud auth application-default login
```
A browser window will open. Sign in with the **Google Account** you want to use.

### 2. Set your Google Cloud Project:
```powershell
gcloud config set project your-google-cloud-project-id
```

### 3. Verify Vertex AI API is Enabled:
In Google Cloud Console, ensure that the **Vertex AI API** is enabled:
- Visit: [https://console.cloud.google.com/apis/library/aiplatform.googleapis.com](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)
- Click **Enable** if it is not already enabled.

---

## Step 4: Understand the Two Modes (Mock vs Real Generation)

CineFlow AI has a built-in safety switch in `.env`:

### Mode A: Free Testing / Mock Mode (`MOCK_VERTEX_AI=true`)
- Perfect for learning the studio, building projects, testing multi-scene reordering, and assembling videos.
- **Cost**: **$0.00 USD** (completely free, no Google Cloud credits or billing touched).
- Video generation is simulated realistically.

### Mode B: Real Google Veo Generation (`MOCK_VERTEX_AI=false`)
- Directly calls Google Vertex AI Veo (`predictLongRunning`).
- Synthesizes real cinematic frames, camera paths, and lighting.
- Saves high-definition `.mp4` video clips into your private Google Cloud Storage bucket.
- Deducts from your **$300 Google Cloud Free Trial Credits**.
- An explicit **Billing Confirmation Modal** always displays the exact dollar estimate before submitting.

---

## Step 5: Start CineFlow AI Studio

### Step 5.1: Build the Shared Package
Run once to compile shared TypeScript definitions:
```powershell
npm run build:shared
```

### Step 5.2: Launch the Backend API (Terminal 1)
Open a terminal in the project folder:
```powershell
npm run dev:api
```
You will see:
```
=======================================================
🎬 CineFlow AI API Service running on port 4000
🔒 Strictly Private Mode: Authorized Owner -> your-email@gmail.com
🛡️ Auth Mode: local_dev
📹 Veo Model: veo-2.0-generate-001 in us-central1
=======================================================
```

### Step 5.3: Launch the Frontend Web Studio (Terminal 2)
Open a second terminal in the project folder:
```powershell
npm run dev:web
```
Your Next.js Studio will be live at:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## Step 6: How to Generate Your First Video

1. Open **[http://localhost:3000](http://localhost:3000)** in your web browser.
2. The Studio will automatically load with an initial starter project or click **New Project** to start fresh.
3. **Customize Your Scene**:
   - **Scene Title**: Give your scene a name (e.g., *Cyberpunk Alley*).
   - **Cinematic Prompt**: Describe the scene (e.g., *"A futuristic detective in a trench coat walking through neon-lit rainy streets, cinematic 35mm"*).
   - **Camera Movement**: Select *Low Angle Tracking*, *Drone Orbit*, or *Slow Zoom In*.
   - **Lighting**: Select *Cyberpunk Neon*, *Golden Hour Sunlight*, or *Moody Noir*.
   - **Aspect Ratio**: Choose **16:9** (Widescreen), **9:16** (Reels/Shorts/TikTok), or **1:1** (Square).
   - **Duration**: Choose 5 to 8 seconds.
4. **Generate**:
   - Click the gold **Generate Scene** button in the right inspector panel.
   - Review the **Billing & Credit Spend Confirmation** modal.
   - Click **Confirm & Generate**.
5. **Preview & Download**:
   - Once Veo renders the scene, it will immediately play in the preview player.
   - Click **Download MP4** to save the clip to your computer.
6. **Multi-Scene Film Assembly**:
   - Add multiple scenes (Scene 1, Scene 2, Scene 3).
   - Drag or use the arrows on the timeline to arrange their story order.
   - Click **Export Final Video** — CineFlow AI uses FFmpeg to concatenate and normalize all clips into a single continuous film!

---

## 🛠️ Troubleshooting & FAQs

### Q1: Can someone else access my studio?
**No.** CineFlow AI is strictly private. Only the email configured in `AUTHORIZED_OWNER_EMAIL` can view or generate assets. In production on Google Cloud Run, Identity-Aware Proxy (IAP) blocks all unauthorized users at Google's edge before they can even reach the application.

### Q2: What if I don't have FFmpeg installed on Windows?
CineFlow AI automatically uses `@ffmpeg-installer/ffmpeg`, a self-contained portable FFmpeg binary included in the repository dependencies. You do not need to install anything separately on your Windows system.

### Q3: How do I change my Google Account later?
Simply update `AUTHORIZED_OWNER_EMAIL=your-new-account@gmail.com` in your `.env` file and re-run `gcloud auth application-default login` with your new account. Everything else updates automatically.

### Q4: How do I run automated tests?
Run:
```powershell
npm run test --workspace=services/api
```
All 10 tests run in safe mock mode without incurring any Google Cloud charges.
