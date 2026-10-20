# CineFlow AI — Private AI Video Generation Studio

![CineFlow AI](https://img.shields.io/badge/CineFlow-AI_Video_Studio-amber?style=for-the-badge)
![Google Cloud Vertex AI](https://img.shields.io/badge/Google_Cloud-Vertex_AI_Veo-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Private Single-User](https://img.shields.io/badge/Access-Strictly_Private-10b981?style=for-the-badge)

**CineFlow AI** is a strictly private, single-owner AI video generation studio inspired by Google Flow and Veo. It provides an end-to-end multi-scene editing workspace for generating cinematic video clips with Google Cloud Vertex AI Veo, tracking operations, organizing timeline scenes, and stitching clips into a final film using FFmpeg.

---

## 🌟 Key Features

- **Strictly Private Personal Studio**: Built solely for your authorized Google Account (configured via `AUTHORIZED_OWNER_EMAIL` in `.env`). Zero public access, no subscriptions, no multi-user SaaS bloat.
- **Real Google Cloud Vertex AI Veo Integration**: Direct integration with Google's official `predictLongRunning` endpoint for Veo models (`veo-2.0-generate-001`, `veo-3.0-generate-001`).
- **Multi-Scene Video Studio**:
  - Horizontal timeline editor with duration, aspect ratio, and status tags.
  - Reorder, duplicate, edit, and delete scenes.
  - Granular control over camera movement, lighting presets, and visual aesthetics.
  - Image-to-Video generation using reference photos.
- **Credit & Cost Protection Protocol**:
  - Real-time cost estimator on every scene and project.
  - Explicit confirmation modal before any billable Vertex AI call.
  - Pre-flight checklist to verify your ~$300 Google Cloud promotional trial credits.
  - Concurrency limiting and duplicate request protection.
- **Private Video Playback & Downloads**: Clips are stored privately in Cloud Storage and served exclusively via short-lived signed URLs.
- **Multi-Scene Video Assembly**: Integrates FFmpeg to concatenate and normalize completed scenes into a single high-definition film.

---

## 🏗️ Monorepo Architecture

```
cineflow-ai/
  apps/
    web/                  # Next.js 14 App Router, Tailwind CSS, Lucide icons
      app/                # Studio, Projects, History, Costs, Settings
      components/         # Timeline, VideoPlayer, SceneEditor, InspectorPanel, Modals
      lib/                # Type-safe API client
  services/
    api/                  # Express REST API (TypeScript)
      src/
        controllers/      # Projects, Scenes, Jobs, Render, Cost controllers
        middleware/       # Auth (Strict Google allowlist), RateLimiter, ErrorHandler
        services/         # VertexVeo, Storage (Signed URLs), Firestore, FFmpeg Assembler
        validators/       # Zod schemas
  packages/
    shared/               # Common types, Veo model configs, pricing, and cost calculators
  infrastructure/
    cloudrun/             # Dockerfiles & Cloud Run deployment scripts
    firestore/            # Security rules and composite indexes
  docs/
    CONFIGURATION_TUTORIAL.md # Complete step-by-step setup tutorial
    GOOGLE_CLOUD_CONSOLE_TUTORIAL.md # Click-by-click Google Cloud Console guide
    LOCAL_SETUP.md        # Windows local development walkthrough
    CREDIT_VERIFICATION.md# Step-by-step credit check guide
    GOOGLE_CLOUD_DEPLOYMENT.md # Cloud Run + IAP production deployment
    SECURITY_ARCHITECTURE.md   # Zero-trust personal access model
  .env.example
  package.json
  README.md
```

---

## 🚀 Quick Start (Local Windows Setup)

### 1. Environment Setup
```powershell
Copy-Item .env.example .env
```

### 2. Google Cloud Application Default Credentials
Authenticate your local environment with your authorized Google Account:
```powershell
gcloud auth application-default login
gcloud config set project your-google-cloud-project-id
```

### 3. Build Shared Package
```powershell
npm run build:shared
```

### 4. Start Development Servers
Open two terminal windows:

**Terminal 1 — Backend API (Port 4000):**
```powershell
npm run dev:api
```

**Terminal 2 — Frontend Studio (Port 3000):**
```powershell
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing

Run the test suite across all packages:
```powershell
npm run test --workspace=services/api
```
All tests verify authentication enforcement, project/scene lifecycle, billing confirmation safeguards, and cost calculations using mocked endpoints with zero Google Cloud charges.

---

## 💰 Official Vertex AI Veo Pricing Reference

| Model | 720p Rate / Sec | 1080p Rate / Sec | 5-Second Scene | 8-Second Scene |
| :--- | :--- | :--- | :--- | :--- |
| **Veo 2.0 (High Cinematic)** | $0.15 / sec | $0.30 / sec | ~$0.75 USD | ~$1.20 USD |
| **Veo 3.0 (Next-Gen)** | $0.20 / sec | $0.40 / sec | ~$1.00 USD | ~$1.60 USD |

*Promotional trial credits cover official Vertex AI Veo usage. Always verify line-item offsets in Google Cloud Billing Reports.*
