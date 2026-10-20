# CineFlow AI — Security Architecture & Access Control

CineFlow AI is built strictly as a **private personal application**, not a multi-tenant public SaaS platform. This document explains the defense-in-depth security principles implemented across all layers.

---

## 1. Zero Public Exposure Model

1. **No Public Registration**: There are no user sign-up pages, onboarding flows, subscription forms, or checkout pages.
2. **Strict Identity Allowlist**: Access is hard-bound to the designated owner email (`official.topanalytica@gmail.com`).
3. **No Public Media Assets**: The Google Cloud Storage bucket uses Uniform Bucket-Level Access with public reads completely disabled (`allUsers` banned). Videos are only accessible via cryptographically signed URLs valid for 60 to 120 minutes.
4. **No Direct Frontend-to-Vertex Calls**: The frontend never holds Google Cloud service account keys or privileged credentials. All generation requests pass through the authenticated Express API.

---

## 2. Authentication and Authorization Layer

The application supports three authentication modes configured via `AUTH_MODE`:

### Mode A: `local_dev` (Local Development)
- In development on `localhost`, requests are automatically attributed to the authorized owner identity.
- Backend still enforces resource ownership checks on every project and scene.

### Mode B: `google_oauth` (Direct Bearer Token)
- The client passes a Google OAuth ID token in the `Authorization: Bearer <ID_TOKEN>` header.
- The backend verifies the cryptographic signature of the token against Google's public certs (`https://www.googleapis.com/oauth2/v3/certs`) using `google-auth-library`.
- The backend validates that `payload.email.toLowerCase() === config.authorizedOwnerEmail.toLowerCase()`. Any other token receives HTTP 403 Forbidden.

### Mode C: `google_iap` (Identity-Aware Proxy — Cloud Run Production)
- Google Cloud IAP verifies Google login at the network edge.
- Google forwards the verified identity via the `x-goog-iap-jwt-assertion` header.
- The backend uses `oauth2Client.getIapPublicKeys()` to cryptographically verify the JWT header and ensures the caller email matches `authorizedOwnerEmail`.

---

## 3. Storage Security & Path Traversal Protection

- In `services/api/src/routes/assets.ts`, streaming endpoints validate expiration timestamps (`exp` query parameter) and sanitize paths using `path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '')` to prevent path traversal attacks.
- Project-isolated storage paths: All clips are saved under `projects/{projectId}/scenes/{sceneId}/{timestamp}_output.mp4`.

---

## 4. Rate Limiting and DoS Protection

- **Standard Rate Limiter**: 120 requests/min per IP to prevent API spam.
- **Generation Rate Limiter**: Maximum 10 generation triggers/min to prevent accidental queue bursts.
- **Concurrency Limiter**: Maximum 2 concurrent video generation jobs running simultaneously. Excess jobs wait in a managed queue.
