# CineFlow AI — Credit and Cost Protection Protocol

This document outlines the mandatory protocol to verify your **Google Cloud Trial Credits** (~$300) and ensure that Vertex AI Veo usage is properly offset before executing paid video generations.

---

## 1. How to Verify Your Credit Balance

1. Log in to the [Google Cloud Console Billing Overview](https://console.cloud.google.com/billing/).
2. Select the Billing Account linked to your Google Cloud project.
3. Under the **Overview** dashboard, locate the **Credits** section.
4. Verify the **Promotional Credit Amount** remaining (e.g., ~$300.00).

---

## 2. Verify Credit Expiration Date

Google Cloud Promotional & Free Trial credits have an expiration date (typically 90 days from activation).
1. In the **Billing Overview**, click on **Promotional Credits**.
2. Note the **Expiration Date** listed for your credit code.
3. **Rule**: Never run large video generation jobs if your credits have expired or are within 24 hours of expiring.

---

## 3. Vertex AI Veo Service Eligibility

- Google Cloud Free Trial promotional credits cover standard Google Cloud Platform core infrastructure and AI services, including **Google Cloud Vertex AI**.
- Third-party SaaS tools or Marketplace third-party partner products are typically excluded from promotional credit coverage, but official **Vertex AI Veo (`veo-2.0-generate-001`, `veo-3.0-generate-001`)** endpoints run directly under Google Cloud infrastructure.
- In Cloud Console > Billing > **Reports**, you can filter charges by &quot;Credits&quot; to inspect line-item offsets.

---

## 4. Current Official Veo Pricing Reference

Vertex AI Veo charges on a **pay-as-you-go, per-output-second** basis for successfully rendered video clips.

| Model Tier | Resolution | Cost / Output Second | 5-Second Clip | 8-Second Clip (Veo Max) |
| :--- | :--- | :--- | :--- | :--- |
| **Veo 2.0 (High Cinematic)** | 720p | **$0.15 / sec** | **~$0.75 USD** | **~$1.20 USD** |
| **Veo 2.0 (High Cinematic)** | 1080p | **$0.30 / sec** | **~$1.50 USD** | **~$2.40 USD** |
| **Veo 3.0 / 3.1 Next-Gen** | 720p | **$0.20 / sec** | **~$1.00 USD** | **~$1.60 USD** |
| **Veo 3.0 / 3.1 Next-Gen** | 1080p | **$0.40 / sec** | **~$2.00 USD** | **~$3.20 USD** |

*Note: Unsuccessful requests, filtered prompts, or requests rejected before completion incur **$0.00** charge.*

---

## 5. Quota Verification

1. Go to [IAM & Admin > Quotas & System Limits](https://console.cloud.google.com/iam-admin/quotas) in Google Cloud Console.
2. In the filter bar, search for `Vertex AI API` or `veo`.
3. Verify that your project has quota for video generation requests (default is typically 2–5 requests per minute).

---

## 6. Recommended Safe Generation Protocol

To ensure your trial credits are offsetting generation costs without unexpected charges:

1. **Start Small**: Generate a single 5-second scene at 720p in the CineFlow AI Studio (Estimated cost: ~$0.75 USD).
2. **Review Billing Reports**: Wait 2 to 4 hours for Google Cloud billing pipeline telemetry to process.
3. Open [Billing > Reports](https://console.cloud.google.com/billing/reports) and group by &quot;Service&quot;.
4. Check that the **Promotional Credits line** offsets the Vertex AI charge, leaving the net invoice amount at **$0.00**.
5. Once confirmed, proceed with multi-scene cinematic generation with peace of mind.
