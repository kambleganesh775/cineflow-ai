'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  Settings,
  Lock,
  ShieldCheck,
  Server,
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [auth, diag] = await Promise.all([
          api.getAuthStatus(),
          api.getCreditsDiagnostic(),
        ]);
        setAuthStatus(auth);
        setDiagnostic(diag);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-cine-950 p-8 select-none">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-amber-400" />
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              Private Application Settings
            </h1>
          </div>
          <p className="text-xs text-cine-400">
            Strict single-user personal configuration and Google Cloud deployment architecture.
          </p>
        </div>

        {/* Section 1: Security & Identity */}
        <div className="bg-cine-900 border border-cine-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cine-850">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h2 className="font-display text-base font-bold text-white">Authorized Owner Identity</h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
              Strictly Private
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1">
              <span className="text-cine-400">Designated Owner Email:</span>
              <div className="font-mono font-semibold text-white truncate">
                {authStatus?.authorizedOwnerEmail || 'official.topanalytica@gmail.com'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1">
              <span className="text-cine-400">Authentication Mode:</span>
              <div className="font-mono font-semibold text-amber-400">
                {authStatus?.authMode || 'local_dev'}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Public Exposure Guarantee</span>
            </div>
            <p className="text-cine-300 text-[11px] leading-relaxed">
              No public registration, multi-user accounts, or billing plans exist. Access is hardcoded to your authorized email address.
            </p>
          </div>
        </div>

        {/* Section 2: Google Cloud Infrastructure */}
        <div className="bg-cine-900 border border-cine-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-cine-850">
            <Cloud className="w-4 h-4 text-amber-400" />
            <h2 className="font-display text-base font-bold text-white">Google Cloud Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1">
              <span className="text-cine-400">Google Cloud Project:</span>
              <div className="font-mono font-semibold text-white">
                {diagnostic?.gcpProject || 'promptwars-494613'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1">
              <span className="text-cine-400">Vertex AI Region:</span>
              <div className="font-mono font-semibold text-white">
                {diagnostic?.location || 'us-central1'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1">
              <span className="text-cine-400">Cloud Storage Bucket (Private):</span>
              <div className="font-mono font-semibold text-white truncate">
                cineflow-ai-private-videos-promptwars-494613
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-1">
              <span className="text-cine-400">Veo Production Model:</span>
              <div className="font-mono font-semibold text-amber-400">
                {diagnostic?.veoConnectivity?.modelId || 'veo-2.0-generate-001'}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Identity-Aware Proxy (IAP) Architecture */}
        <div className="bg-cine-900 border border-cine-800 rounded-2xl p-6 space-y-3 text-xs">
          <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <span>Cloud Run &amp; IAP Private Architecture</span>
          </h2>
          <p className="text-cine-400 leading-relaxed">
            For production remote access, CineFlow AI runs on Google Cloud Run protected by Identity-Aware Proxy (IAP). IAP intercepts requests at the Google edge network and cryptographically signs the <code className="text-amber-400 font-mono">x-goog-iap-jwt-assertion</code> header with Google&apos;s certs, allowing only your authenticated Google account to reach the application.
          </p>
        </div>
      </div>
    </div>
  );
}
