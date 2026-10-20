'use client';

import React from 'react';
import {
  Coins,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

interface CreditGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  gcpProject?: string;
}

export function CreditGuidanceModal({
  isOpen,
  onClose,
  gcpProject = 'your-google-cloud-project-id',
}: CreditGuidanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-cine-900 border border-cine-700 rounded-2xl shadow-2xl overflow-hidden p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-cine-400 hover:text-white hover:bg-cine-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Google Cloud Credits & Spend Verification Guide
            </h3>
            <p className="text-xs text-cine-400">
              Personal spending protection for Google Cloud Project: <strong className="text-amber-400 font-mono">{gcpProject}</strong>
            </p>
          </div>
        </div>

        {/* Step-by-step guidance list */}
        <div className="space-y-4 text-xs text-cine-300">
          {/* Step 1: Credit Balance */}
          <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>1. Verify Credit Balance ($300 Trial)</span>
              </span>
              <a
                href="https://console.cloud.google.com/billing/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Open Cloud Billing</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-cine-400 leading-relaxed">
              Open the Google Cloud Console Billing Overview tab. Under &quot;Promotional Credits&quot;, check your remaining balance to confirm your $300 trial is active.
            </p>
          </div>

          {/* Step 2: Expiry Date */}
          <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>2. Verify Credit Expiration Date</span>
              </span>
            </div>
            <p className="text-cine-400 leading-relaxed">
              Standard Google Cloud trial credits expire after 90 days or when the balance is exhausted. Confirm the expiration date listed next to your promotional credit code.
            </p>
          </div>

          {/* Step 3: Vertex AI Eligibility */}
          <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>3. Vertex AI Veo Service Eligibility</span>
              </span>
            </div>
            <p className="text-cine-400 leading-relaxed">
              Google Cloud Free Trial credits apply to all core Google Cloud Platform APIs including Vertex AI. Note that third-party Marketplace offerings or external partner subscriptions are not covered, but official Vertex AI Veo endpoints are eligible.
            </p>
          </div>

          {/* Step 4: Pricing Model */}
          <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>4. Verified Official Veo Pricing</span>
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-cine-900 border border-cine-800">
                <div className="text-cine-400">720p Resolution</div>
                <div className="text-amber-400 font-bold">$0.15 / second</div>
                <div className="text-cine-500 text-[10px]">5s clip = ~$0.75 USD</div>
              </div>
              <div className="p-2 rounded-lg bg-cine-900 border border-cine-800">
                <div className="text-cine-400">1080p Resolution</div>
                <div className="text-amber-400 font-bold">$0.30 / second</div>
                <div className="text-cine-500 text-[10px]">5s clip = ~$1.50 USD</div>
              </div>
            </div>
            <p className="text-[10px] text-cine-500">
              * Charges apply solely to completed videos. Failed or filtered prompts incur $0 charge.
            </p>
          </div>

          {/* Step 5: Recommended Safe Test Strategy */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>5. Recommended Safe First Generation</span>
            </div>
            <p className="text-cine-300 leading-relaxed">
              Generate a single 5-second 720p scene (~$0.75) first. Then, wait 2 to 4 hours and inspect Google Cloud Billing Reports grouped by &quot;Credits&quot; to verify that the promotional credits offset the line item before running multi-scene exports.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-cine-850 hover:bg-cine-800 border border-cine-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            I Understand — Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
