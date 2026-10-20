'use client';

import React, { useState } from 'react';
import { Scene, CAMERA_MOVEMENTS, LIGHTING_STYLES, VISUAL_STYLES } from '@cineflow/shared';
import {
  Sparkles,
  Camera,
  Sun,
  Palette,
  Image as ImageIcon,
  X,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Wand2,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';

interface SceneEditorProps {
  scene: Scene | null;
  onUpdateScene: (updates: Partial<Scene>) => void;
}

export function SceneEditor({ scene, onUpdateScene }: SceneEditorProps) {
  const [showNegative, setShowNegative] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  if (!scene) {
    return (
      <div className="p-6 text-center text-cine-400 text-sm">
        Select a scene from the timeline below to edit its prompt and style parameters.
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const result = await api.uploadReferenceImage(file);
      onUpdateScene({ referenceImageBase64: result.dataUri });
    } catch (err: any) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    onUpdateScene({ referenceImageBase64: undefined });
  };

  return (
    <div className="p-6 bg-cine-900 border-t border-cine-800 space-y-4">
      {/* Scene Title */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          value={scene.title}
          onChange={(e) => onUpdateScene({ title: e.target.value })}
          className="bg-transparent text-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-400 rounded px-2 py-1 -ml-2 w-full max-w-md font-display"
          placeholder="Scene Title"
        />

        <div className="flex items-center gap-2">
          <span className="text-xs text-cine-400">Order: #{scene.orderIndex + 1}</span>
        </div>
      </div>

      {/* Main Prompt Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-cine-300">
          <label className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cinematic Prompt</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!scene.prompt?.trim()) return;
                try {
                  setIsEnhancing(true);
                  const res = await api.enhancePrompt({
                    prompt: scene.prompt,
                    cameraMovement: scene.cameraMovement,
                    lighting: scene.lighting,
                    visualStyle: scene.visualStyle,
                  });
                  onUpdateScene({
                    prompt: res.enhancedPrompt,
                    cameraMovement: res.suggestedCamera,
                    lighting: res.suggestedLighting,
                    visualStyle: res.suggestedStyle,
                  });
                } catch (err: any) {
                  alert(`Prompt enhancement failed: ${err.message}`);
                } finally {
                  setIsEnhancing(false);
                }
              }}
              disabled={isEnhancing || !scene.prompt?.trim()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-amber-500/20 hover:from-purple-500/30 hover:to-amber-500/30 border border-purple-500/30 text-[11px] font-semibold text-purple-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              title="Automatically expand with cinematic textures, lighting and camera vectors"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                  <span>Omni Enhancing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3 text-purple-400" />
                  <span>✨ Enhance with Omni</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-cine-400">{scene.prompt?.length || 0} / 2000 chars</span>
          </div>
        </div>
        <textarea
          rows={3}
          value={scene.prompt}
          onChange={(e) => onUpdateScene({ prompt: e.target.value })}
          placeholder="Describe the action, subjects, environment, mood, and motion in high cinematic detail..."
          className="w-full bg-cine-950 border border-cine-800 rounded-xl p-3.5 text-sm text-white placeholder-cine-500 focus:outline-none focus:border-amber-400/80 transition-colors leading-relaxed"
        />
      </div>

      {/* Style & Camera Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Camera Movement */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-cine-400 flex items-center gap-1">
            <Camera className="w-3 h-3 text-amber-400" />
            <span>Camera Movement</span>
          </label>
          <select
            value={scene.cameraMovement || ''}
            onChange={(e) => onUpdateScene({ cameraMovement: e.target.value || undefined })}
            className="w-full bg-cine-950 border border-cine-800 rounded-lg px-3 py-2 text-xs text-cine-200 focus:outline-none focus:border-amber-400"
          >
            <option value="">Default / Unspecified</option>
            {CAMERA_MOVEMENTS.map((mov) => (
              <option key={mov} value={mov}>
                {mov}
              </option>
            ))}
          </select>
        </div>

        {/* Lighting Preset */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-cine-400 flex items-center gap-1">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Lighting Preset</span>
          </label>
          <select
            value={scene.lighting || ''}
            onChange={(e) => onUpdateScene({ lighting: e.target.value || undefined })}
            className="w-full bg-cine-950 border border-cine-800 rounded-lg px-3 py-2 text-xs text-cine-200 focus:outline-none focus:border-amber-400"
          >
            <option value="">Default / Natural</option>
            {LIGHTING_STYLES.map((light) => (
              <option key={light} value={light}>
                {light}
              </option>
            ))}
          </select>
        </div>

        {/* Visual Style Preset */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-cine-400 flex items-center gap-1">
            <Palette className="w-3 h-3 text-amber-400" />
            <span>Visual Aesthetic</span>
          </label>
          <select
            value={scene.visualStyle || ''}
            onChange={(e) => onUpdateScene({ visualStyle: e.target.value || undefined })}
            className="w-full bg-cine-950 border border-cine-800 rounded-lg px-3 py-2 text-xs text-cine-200 focus:outline-none focus:border-amber-400"
          >
            <option value="">Default Photorealistic</option>
            {VISUAL_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reference Image for Image-to-Video */}
      <div className="pt-2 border-t border-cine-800/80">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-cine-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Reference Image (Image-to-Video)</span>
          </label>
          <span className="text-[11px] text-cine-400">Optional starting frame</span>
        </div>

        {scene.referenceImageBase64 ? (
          <div className="relative inline-block rounded-xl overflow-hidden border border-cine-700 bg-cine-950 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scene.referenceImageBase64}
              alt="Reference starting frame"
              className="h-24 w-36 object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
              title="Remove reference image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-cine-700 hover:border-amber-400/50 bg-cine-950/50 cursor-pointer text-xs text-cine-400 hover:text-white transition-all w-fit">
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span>{isUploadingImage ? 'Uploading...' : 'Upload Reference Photo'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploadingImage}
            />
          </label>
        )}
      </div>

      {/* Collapsible Negative Prompt */}
      <div className="pt-2 border-t border-cine-800/80">
        <button
          onClick={() => setShowNegative(!showNegative)}
          className="flex items-center gap-1.5 text-xs text-cine-400 hover:text-cine-200 transition-colors"
        >
          {showNegative ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>Negative Prompt (Exclude attributes)</span>
        </button>

        {showNegative && (
          <div className="mt-2">
            <input
              type="text"
              value={scene.negativePrompt || ''}
              onChange={(e) => onUpdateScene({ negativePrompt: e.target.value })}
              placeholder="e.g. blurry, low quality, oversaturated, deformed faces..."
              className="w-full bg-cine-950 border border-cine-800 rounded-lg p-2.5 text-xs text-white placeholder-cine-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
