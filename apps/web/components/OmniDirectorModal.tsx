'use client';

import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  X,
  Layers,
  Film,
  Camera,
  Sun,
  Palette,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';

interface OmniDirectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onScenesCreated: () => void;
}

export function OmniDirectorModal({
  isOpen,
  onClose,
  projectId,
  onScenesCreated,
}: OmniDirectorModalProps) {
  const [concept, setConcept] = useState('');
  const [genre, setGenre] = useState('Cyberpunk Sci-Fi');
  const [sceneCount, setSceneCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const genres = [
    'Cyberpunk Sci-Fi',
    'Moody Film Noir',
    'Epic Fantasy & Myth',
    'Cinematic Action & Chase',
    'Hyperrealistic Nature',
    'Post-Apocalyptic Survival',
    'Atmospheric Anime Style',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    try {
      setIsGenerating(true);
      setGeneratedResult(null);
      const res = await api.generateStoryboard({
        projectId,
        concept: concept.trim(),
        genre,
        sceneCount,
        applyToProject: false,
      });
      setGeneratedResult(res.storyboard);
    } catch (err: any) {
      alert(`Omni Director generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToTimeline = async () => {
    if (!generatedResult || !projectId) return;

    try {
      setIsApplying(true);
      await api.generateStoryboard({
        projectId,
        concept: concept.trim(),
        genre,
        sceneCount,
        applyToProject: true,
      });
      onScenesCreated();
      onClose();
      alert(`Success! ${generatedResult.scenes.length} scenes added to your timeline.`);
    } catch (err: any) {
      alert(`Failed to add scenes: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-cine-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-cine-400 hover:text-white hover:bg-cine-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Wand2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-white tracking-tight">
                AI Omni Director
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Storyboard Co-Pilot
              </span>
            </div>
            <p className="text-xs text-cine-400">
              Type a story idea — Omni writes the entire multi-scene cinematic storyboard automatically.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!generatedResult ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-cine-300 block mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Story Concept or Movie Logline *</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g. A lone cyber-samurai walks through rainy neon ruins at dusk, tracking an ethereal robotic fox across ancient torii gates..."
                  className="w-full bg-cine-950 border border-cine-800 rounded-xl p-3 text-xs text-white placeholder-cine-500 focus:outline-none focus:border-purple-400 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-cine-300 block mb-1">
                    Cinematic Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-cine-950 border border-cine-800 rounded-xl p-2.5 text-xs text-cine-200 focus:outline-none focus:border-purple-400"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-cine-300 block mb-1 flex items-center justify-between">
                    <span>Scene Count</span>
                    <span className="font-mono text-purple-400">{sceneCount} scenes</span>
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={6}
                    step={1}
                    value={sceneCount}
                    onChange={(e) => setSceneCount(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-cine-800 rounded-lg appearance-none cursor-pointer accent-purple-400 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-cine-500 font-mono mt-1">
                    <span>2 Scenes (Quick)</span>
                    <span>6 Scenes (Full Arc)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || !concept.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Omni Is Directing Storyboard...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Multi-Scene Storyboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Generated Result Summary */}
              <div className="p-4 rounded-xl bg-cine-950 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display text-sm font-bold text-white">
                    {generatedResult.title}
                  </h3>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {generatedResult.scenes.length} Scenes
                  </span>
                </div>
                <p className="text-xs text-cine-400 italic leading-relaxed">
                  &quot;{generatedResult.synopsis}&quot;
                </p>
              </div>

              {/* Generated Scenes List */}
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {generatedResult.scenes.map((scene: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-cine-950/70 border border-cine-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        #{idx + 1} {scene.title}
                      </span>
                      <span className="text-[10px] font-mono text-cine-400">{scene.durationSeconds}s</span>
                    </div>
                    <p className="text-[11px] text-cine-300 leading-relaxed">{scene.prompt}</p>
                    <div className="flex items-center gap-3 text-[10px] text-cine-400 pt-1 font-mono">
                      <span className="flex items-center gap-1 text-amber-400">
                        <Camera className="w-3 h-3" />
                        {scene.cameraMovement}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-cine-300">
                        <Sun className="w-3 h-3" />
                        {scene.lighting}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-cine-800">
                <button
                  type="button"
                  onClick={() => setGeneratedResult(null)}
                  className="px-4 py-2 rounded-xl bg-cine-850 hover:bg-cine-800 text-xs text-cine-400 hover:text-white"
                >
                  ← Edit Concept
                </button>

                <button
                  type="button"
                  onClick={handleApplyToTimeline}
                  disabled={isApplying}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding to Timeline...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Add All Scenes to Timeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
