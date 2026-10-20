'use client';

import React from 'react';
import {
  AlertTriangle,
  Coins,
  CheckCircle,
  X,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface BillingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  totalCostUsd: number;
  sceneCount: number;
  totalDurationSeconds: number;
  resolution: string;
  modelId: string;
}

export function BillingConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  totalCostUsd,
  sceneCount,
  totalDurationSeconds,
  resolution,
  modelId,
}: BillingConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-cine-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-cine-400 hover:text-white hover:bg-cine-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Billing & Credit Spend Confirmation
            </h3>
            <p className="text-xs text-cine-400">
              Verify parameters before initiating Google Cloud Vertex AI generation.
            </p>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="p-4 rounded-xl bg-cine-950 border border-cine-800 space-y-3 mb-5">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-cine-850">
            <span className="text-cine-400">Action:</span>
            <span className="text-white font-semibold">{title}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-cine-400">Model:</span>
            <span className="font-mono text-amber-400">{modelId}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-cine-400">Total Output Duration:</span>
            <span className="font-mono text-white">{totalDurationSeconds}s ({sceneCount} scene{sceneCount > 1 ? 's' : ''})</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-cine-400">Resolution:</span>
            <span className="font-mono text-white">{resolution}</span>
          </div>

          <div className="flex items-center justify-between text-sm pt-2 border-t border-cine-850">
            <span className="font-bold text-white">Estimated Cost:</span>
            <span className="font-mono font-bold text-lg text-amber-400">
              ${totalCostUsd.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Safeguard Checklist */}
        <div className="space-y-2 mb-6 text-xs text-cine-300">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>If you have active Google Cloud trial credits, this charge will be deducted from your credit balance.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Generation is charged strictly on successful output delivery per second.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Once confirmed, Vertex AI Veo will begin rendering frames immediately.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-cine-850 hover:bg-cine-800 text-xs font-semibold text-cine-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-cine-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Confirm & Generate (${totalCostUsd.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
