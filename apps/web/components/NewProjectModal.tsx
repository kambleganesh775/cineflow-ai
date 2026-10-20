'use client';

import React, { useState } from 'react';
import { AspectRatio, Resolution, DEFAULT_VEO_MODEL } from '@cineflow/shared';
import { FolderPlus, X, Sparkles } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    settings: {
      defaultModelId: string;
      defaultAspectRatio: AspectRatio;
      defaultResolution: Resolution;
      defaultDurationSeconds: number;
    };
  }) => Promise<void>;
}

export function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [duration, setDuration] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        settings: {
          defaultModelId: DEFAULT_VEO_MODEL,
          defaultAspectRatio: aspectRatio,
          defaultResolution: resolution,
          defaultDurationSeconds: duration,
        },
      });
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-md bg-cine-900 border border-cine-700 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-cine-400 hover:text-white hover:bg-cine-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">Create New Project</h3>
            <p className="text-xs text-cine-400">Initialize a multi-scene cinematic workspace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-cine-300 block mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chronicles of Europa, Midnight Drifter..."
              className="w-full bg-cine-950 border border-cine-800 rounded-xl p-2.5 text-xs text-white placeholder-cine-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-cine-300 block mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief logline or visual theme of this project..."
              className="w-full bg-cine-950 border border-cine-800 rounded-xl p-2.5 text-xs text-white placeholder-cine-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-cine-300 block mb-1">
                Default Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full bg-cine-950 border border-cine-800 rounded-xl p-2 text-xs text-cine-200 focus:outline-none focus:border-amber-400"
              >
                <option value="16:9">16:9 (Cinematic Widescreen)</option>
                <option value="9:16">9:16 (Vertical Reels/Shorts)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-cine-300 block mb-1">
                Default Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as Resolution)}
                className="w-full bg-cine-950 border border-cine-800 rounded-xl p-2 text-xs text-cine-200 focus:outline-none focus:border-amber-400"
              >
                <option value="720p">720p (Cost-Efficient)</option>
                <option value="1080p">1080p (Full High-Def)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-cine-850 hover:bg-cine-800 text-xs font-medium text-cine-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-cine-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Creating...' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
