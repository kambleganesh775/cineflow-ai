'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  CreditCard,
  Coins,
  ShieldCheck,
  Calendar,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Info,
} from 'lucide-react';
import { VEO_MODELS } from '@cineflow/shared';

export default function CostPage() {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDiagnostic() {
      try {
        const data = await api.getCreditsDiagnostic();
        setDiagnostic(data);
      } catch (err) {
        console.error('Failed to fetch cost diagnostics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDiagnostic();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-cine-950 p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                Credits & Cost Protection Center
              </h1>
            </div>
            <p className="text-xs text-cine-400">
              Personal spending safeguards, credit verification guidance, and Vertex AI Veo pricing.
            </p>
          </div>

          <a
            href="https://console.cloud.google.com/billing/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cine-900 hover:bg-cine-850 border border-cine-800 text-amber-400 font-semibold text-xs transition-all shadow-sm"
          >
            <span>Google Cloud Billing Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 3 Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Potential Credits */}
          <div className="bg-cine-900 border border-cine-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-cine-400">
              <span>Potential Credits</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">~$300.00 USD</div>
            <p className="text-[11px] text-cine-400">
              Subject to active promotion and billing eligibility on Google Cloud.
            </p>
          </div>

          {/* Card 2: Cost Confirmation Gate */}
          <div className="bg-cine-900 border border-cine-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-cine-400">
              <span>Safeguard Protection</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-display text-emerald-400">Active & Enforced</div>
            <p className="text-[11px] text-cine-400">
              Every generation requires explicit approval in a modal before API call.
            </p>
          </div>

          {/* Card 3: Vertex AI Quota Status */}
          <div className="bg-cine-900 border border-cine-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-cine-400">
              <span>Model Endpoint</span>
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-bold font-mono text-white truncate">
              {diagnostic?.veoConnectivity?.modelId || 'veo-2.0-generate-001'}
            </div>
            <p className="text-[11px] text-cine-400">
              Location: <span className="font-mono text-amber-400">{diagnostic?.location || 'us-central1'}</span>
            </p>
          </div>
        </div>

        {/* Verified Official Pricing Table */}
        <div className="bg-cine-900 border border-cine-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <h2 className="font-display text-base font-bold text-white">
              Official Google Vertex AI Veo Pricing
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cine-950 text-cine-400 font-mono text-[11px] uppercase border-b border-cine-800">
                <tr>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">720p Rate / Sec</th>
                  <th className="py-3 px-4">1080p Rate / Sec</th>
                  <th className="py-3 px-4">5s Clip Estimate</th>
                  <th className="py-3 px-4">8s Clip Estimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cine-850 font-mono">
                {Object.values(VEO_MODELS).map((m) => (
                  <tr key={m.id} className="hover:bg-cine-850/50">
                    <td className="py-3 px-4 font-semibold text-white">{m.name}</td>
                    <td className="py-3 px-4 text-amber-400">${m.costPerSecond720pUsd.toFixed(2)}/s</td>
                    <td className="py-3 px-4 text-amber-400">${m.costPerSecond1080pUsd.toFixed(2)}/s</td>
                    <td className="py-3 px-4 text-cine-300">
                      ${(m.costPerSecond720pUsd * 5).toFixed(2)} (720p) / ${(m.costPerSecond1080pUsd * 5).toFixed(2)} (1080p)
                    </td>
                    <td className="py-3 px-4 text-cine-300">
                      ${(m.costPerSecond720pUsd * 8).toFixed(2)} (720p) / ${(m.costPerSecond1080pUsd * 8).toFixed(2)} (1080p)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-cine-400 leading-relaxed">
            * Billing occurs strictly upon successful generation. Filtered or failed generation attempts do not incur charges.
          </p>
        </div>

        {/* Credit Verification Protocol Checklist */}
        <div className="bg-cine-900 border border-cine-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Pre-Generation Credit Verification Protocol</span>
          </h2>

          <div className="space-y-3 text-xs text-cine-300">
            {diagnostic?.instructions?.map((step: string, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-cine-950 border border-cine-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{step}</p>
              </div>
            )) || (
              <p className="text-cine-400">Loading verification steps...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
