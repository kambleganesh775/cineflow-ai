'use client';

import React from 'react';
import { Scene } from '@cineflow/shared';
import {
  Plus,
  Play,
  Film,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface TimelineProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onAddScene: () => void;
  onMoveScene: (index: number, direction: 'left' | 'right') => void;
  onDuplicateScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
}

export function Timeline({
  scenes,
  selectedSceneId,
  onSelectScene,
  onAddScene,
  onMoveScene,
  onDuplicateScene,
  onDeleteScene,
}: TimelineProps) {
  const totalDuration = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

  return (
    <div className="bg-cine-900 border-t border-cine-800 p-4 select-none">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold tracking-wider uppercase text-cine-200">
              Multi-Scene Timeline
            </span>
          </div>
          <span className="text-xs text-cine-400">
            {scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-cine-400">
          <Clock className="w-3.5 h-3.5 text-cine-400" />
          <span>Total Runtime: <strong className="text-white font-mono">{totalDuration}s</strong></span>
        </div>
      </div>

      {/* Horizontal Timeline Track */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {scenes.map((scene, idx) => {
          const isSelected = selectedSceneId === scene.id;

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`relative group shrink-0 w-52 h-32 rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-cine-850 border-amber-400 ring-2 ring-amber-400/20 shadow-lg'
                  : 'bg-cine-850/80 border-cine-800 hover:border-cine-700'
              }`}
            >
              {/* Scene Card Header */}
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cine-800 text-cine-300 font-bold">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-white truncate max-w-[100px]">
                    {scene.title}
                  </span>
                </div>

                {/* Status Badge */}
                {scene.status === 'completed' && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    Ready
                  </span>
                )}
                {scene.status === 'running' && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Veo
                  </span>
                )}
                {scene.status === 'queued' && (
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    Queued
                  </span>
                )}
                {scene.status === 'failed' && (
                  <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Failed
                  </span>
                )}
                {scene.status === 'draft' && (
                  <span className="text-[10px] text-cine-400 bg-cine-800 px-1.5 py-0.5 rounded">
                    Draft
                  </span>
                )}
              </div>

              {/* Scene Prompt Snippet */}
              <p className="text-[11px] text-cine-400 line-clamp-2 leading-relaxed">
                {scene.prompt || 'No prompt specified...'}
              </p>

              {/* Scene Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-cine-800/80 text-[10px] text-cine-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">{scene.durationSeconds}s</span>
                  <span>•</span>
                  <span>{scene.resolution}</span>
                  <span>•</span>
                  <span>{scene.aspectRatio}</span>
                </div>

                {/* Hover Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveScene(idx, 'left');
                      }}
                      className="p-1 hover:text-white hover:bg-cine-800 rounded transition-colors"
                      title="Move Earlier"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  {idx < scenes.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveScene(idx, 'right');
                      }}
                      className="p-1 hover:text-white hover:bg-cine-800 rounded transition-colors"
                      title="Move Later"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateScene(scene.id);
                    }}
                    className="p-1 hover:text-amber-400 hover:bg-cine-800 rounded transition-colors"
                    title="Duplicate Scene"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScene(scene.id);
                      }}
                      className="p-1 hover:text-rose-400 hover:bg-cine-800 rounded transition-colors"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Scene Card */}
        <button
          onClick={onAddScene}
          className="shrink-0 w-36 h-32 rounded-xl border border-dashed border-cine-700 hover:border-amber-400/50 hover:bg-cine-850/50 flex flex-col items-center justify-center gap-2 text-cine-400 hover:text-amber-400 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-cine-800 group-hover:bg-amber-400/10 flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">Add Scene</span>
        </button>
      </div>
    </div>
  );
}
