'use client';

import React from 'react';
import {
  Scene,
  Project,
  VEO_MODELS,
  calculateVeoCost,
  AspectRatio,
  Resolution,
} from '@cineflow/shared';
import {
  Cpu,
  Tv,
  Clock,
  Layers,
  Sparkles,
  PlaySquare,
  Flame,
  Film,
  Coins,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface InspectorPanelProps {
  scene: Scene | null;
  project: Project | null;
  onUpdateScene: (updates: Partial<Scene>) => void;
  onGenerateScene: (sceneId: string) => void;
  onGenerateAll: () => void;
  onRenderProject: () => void;
  isRendering?: boolean;
}

export function InspectorPanel({
  scene,
  project,
  onUpdateScene,
  onGenerateScene,
  onGenerateAll,
  onRenderProject,
  isRendering = false,
}: InspectorPanelProps) {
  if (!scene) {
    return (
      <aside className="w-80 bg-cine-900 border-l border-cine-800 p-6 flex flex-col justify-center items-center text-center text-cine-400 select-none">
        <Film className="w-10 h-10 mb-3 text-cine-700" />
        <p className="text-xs">Select or add a scene to inspect and configure generation parameters.</p>
      </aside>
    );
  }

  const modelMeta = VEO_MODELS[scene.modelId] || VEO_MODELS['veo-2.0-generate-001'];
  const costEstimate = calculateVeoCost(scene.modelId, scene.durationSeconds, scene.resolution);

  const aspectRatios: { id: AspectRatio; label: string; ratio: string }[] = [
    { id: '16:9', label: '16:9 Widescreen', ratio: 'w-6 h-3.5' },
    { id: '9:16', label: '9:16 Vertical', ratio: 'w-3.5 h-6' },
    { id: '1:1', label: '1:1 Square', ratio: 'w-5 h-5' },
  ];

  const resolutions: Resolution[] = ['720p', '1080p'];

  return (
    <aside className="w-84 bg-cine-900 border-l border-cine-800 flex flex-col h-full overflow-y-auto select-none p-5 space-y-6">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cine-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Veo Inspector
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
          Vertex AI
        </span>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-cine-300 flex items-center justify-between">
          <span>Veo Model</span>
          <span className="text-[10px] text-cine-400">Google Cloud</span>
        </label>
        <select
          value={scene.modelId}
          onChange={(e) => onUpdateScene({ modelId: e.target.value })}
          className="w-full bg-cine-950 border border-cine-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
        >
          {Object.values(VEO_MODELS).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-cine-400 leading-tight">
          {modelMeta.description}
        </p>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-cine-300">Aspect Ratio</label>
        <div className="grid grid-cols-3 gap-2">
          {aspectRatios.map((ar) => {
            const isSelected = scene.aspectRatio === ar.id;
            return (
              <button
                key={ar.id}
                onClick={() => onUpdateScene({ aspectRatio: ar.id })}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'bg-cine-850 border-amber-400 text-amber-400 shadow-sm'
                    : 'bg-cine-950 border-cine-800 text-cine-400 hover:text-white hover:border-cine-700'
                }`}
              >
                <div
                  className={`border-2 rounded-sm mb-1.5 ${
                    isSelected ? 'border-amber-400' : 'border-cine-600'
                  } ${ar.ratio}`}
                />
                <span className="text-[10px] font-bold">{ar.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-cine-300">Resolution</label>
        <div className="grid grid-cols-2 gap-2">
          {resolutions.map((res) => {
            const isSelected = scene.resolution === res;
            return (
              <button
                key={res}
                onClick={() => onUpdateScene({ resolution: res })}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-cine-850 border-amber-400 text-amber-400 shadow-sm'
                    : 'bg-cine-950 border-cine-800 text-cine-400 hover:text-white'
                }`}
              >
                {res} {res === '1080p' ? '(FHD)' : '(Standard)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-cine-300">
          <span>Clip Duration</span>
          <span className="font-mono text-amber-400">{scene.durationSeconds} seconds</span>
        </div>
        <input
          type="range"
          min={modelMeta.minDurationSeconds}
          max={modelMeta.maxDurationSeconds}
          step={1}
          value={scene.durationSeconds}
          onChange={(e) => onUpdateScene({ durationSeconds: parseInt(e.target.value, 10) })}
          className="w-full h-1.5 bg-cine-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
        />
        <div className="flex justify-between text-[10px] text-cine-500 font-mono">
          <span>{modelMeta.minDurationSeconds}s</span>
          <span>{modelMeta.maxDurationSeconds}s (Veo Max)</span>
        </div>
      </div>

      {/* Live Cost Estimation Card */}
      <div className="p-3.5 rounded-xl bg-cine-950 border border-amber-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Coins className="w-3.5 h-3.5" />
            <span>Cost Protection</span>
          </div>
          <span className="text-xs font-mono font-bold text-white">
            ${costEstimate.estimatedCostUsd.toFixed(2)} USD
          </span>
        </div>
        <p className="text-[10px] text-cine-400 leading-relaxed">
          Rate: ${costEstimate.ratePerSecondUsd.toFixed(2)}/sec for {scene.durationSeconds}s at {scene.resolution}. Deducted from eligible promotional credits if active.
        </p>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2.5 pt-2">
        {/* Generate Current Scene */}
        <button
          onClick={() => onGenerateScene(scene.id)}
          disabled={scene.status === 'running' || scene.status === 'queued'}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-cine-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Sparkles className="w-4 h-4 stroke-[2.5]" />
          <span>{scene.status === 'running' ? 'Generating Clip...' : 'Generate Scene'}</span>
        </button>

        {/* Generate All Scenes */}
        <button
          onClick={onGenerateAll}
          className="w-full py-2.5 px-4 rounded-xl bg-cine-850 hover:bg-cine-800 border border-cine-700 text-cine-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <PlaySquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Queue All Scenes</span>
        </button>

        {/* Export Final Video Assembly */}
        <button
          onClick={onRenderProject}
          disabled={isRendering}
          className="w-full py-2.5 px-4 rounded-xl bg-cine-850 hover:bg-cine-800 border border-cine-700 text-cine-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Film className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isRendering ? 'Stitching Scenes (FFmpeg)...' : 'Export Final Video'}</span>
        </button>
      </div>
    </aside>
  );
}
