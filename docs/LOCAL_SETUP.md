# CineFlow AI — Windows Local Development Guide

This guide explains how to set up, run, and test **CineFlow AI** on your Windows environment for personal AI video generation.

---

## 1. Prerequisites

Verify that the following tools are installed on your machine:
- **Node.js**: v20 or higher (`node -v`)
- **npm**: v10 or higher (`npm -v`)
- **Git**: (`git --version`)
- **Google Cloud CLI (`gcloud`)**: (`gcloud --version`)

---

## 2. Environment Configuration

1. In the root directory `c:\Users\HP\OneDrive\Desktop\cineflow-ai`, create a `.env` file based on `.env.example`:
```powershell
Copy-Item .env.example .env
```

2. Inspect `.env` and verify key variables:
```env
# Google Cloud
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_STORAGE_BUCKET=cineflow-ai-private-videos-your-project-id
VEO_MODEL_ID=veo-2.0-generate-001

# Personal Ownership
AUTHORIZED_OWNER_EMAIL=your-google-email@gmail.com
AUTH_MODE=local_dev

# Cost & Safety Guards
REQUIRE_BILLING_CONFIRMATION=true
MOCK_VERTEX_AI=false
```

---

## 3. Google Cloud Authentication Setup

For local development, Google Cloud APIs use **Application Default Credentials (ADC)**.

Run the following command in PowerShell:
```powershell
gcloud auth application-default login
```
This opens your browser to log in with your authorized Google Account. This grants the local Node.js backend credentials to authenticate calls to Vertex AI Veo and Cloud Storage.

Set your default Google Cloud project:
```powershell
gcloud config set project your-google-cloud-project-id
```

---

## 4. Building and Running Locally

### Step 1: Build the Shared Package
```powershell
npm run build:shared
```

### Step 2: Run the Backend API Service (Port 4000)
Open a terminal in the root directory:
```powershell
npm run dev:api
```
The API starts at `http://localhost:4000` and displays:
```
=======================================================
🎬 CineFlow AI API Service running on port 4000
🔒 Strictly Private Mode: Authorized Owner -> your-email@gmail.com
🛡️ Auth Mode: local_dev
📹 Veo Model: veo-2.0-generate-001 in us-central1
☁️ Cloud Storage: cineflow-ai-private-videos-your-project-id
=======================================================
```

### Step 3: Run the Next.js Web Studio (Port 3000)
Open a second terminal in the root directory:
```powershell
npm run dev:web
```
Open your browser at `http://localhost:3000`.

---

## 5. Development Modes: Mock vs Real Generation

To test UI workflows, timeline reordering, and video assembly without triggering billable Google Cloud calls:
- In `.env`, set `MOCK_VERTEX_AI=true`.
- The system will simulate realistic Veo rendering timelines and provide preview video clips with zero Google Cloud charges.

When ready to generate real videos with Google Cloud Vertex AI Veo:
- Set `MOCK_VERTEX_AI=false`.
- Ensure `REQUIRE_BILLING_CONFIRMATION=true` to maintain the explicit cost confirmation modal safeguard before every paid call.

---

## 6. Using the AI Omni Director Co-Pilot

CineFlow AI includes **AI Omni Director**, an intelligent storyboarding and prompt engineering co-pilot:

1. **Automatic Multi-Scene Storyboarding**:
   - In the Studio header, click the **✨ Omni Director** button.
   - Describe your story idea (e.g., *"A solitary astronaut discovering an ancient alien monolithic structure in an icy canyon on Europa"*).
   - Select your preferred **Genre** (*Sci-Fi, Cyberpunk, Cinematic Drama, Fantasy, Thriller, Documentary*) and **Pacing** (*Slow, Dynamic, Fast*).
   - Click **Generate Storyboard with Omni**.
   - Review the generated scenes and click **Import All Scenes to Project** to immediately populate your timeline.

2. **Scene Prompt Enhancer**:
   - When editing any individual scene in the Scene Editor, enter a simple description and click **✨ Enhance with Omni**.
   - Omni Director rewrites the prompt into a professional cinematic prompt with camera lenses (e.g. 35mm anamorphic), volumetric lighting, and camera paths.

---

## 7. Running Automated Tests

Run the full suite of unit, security, and API tests:
```powershell
npm run test --workspace=services/api
```
All tests run with mocked endpoints and will never incur Google Cloud charges.
