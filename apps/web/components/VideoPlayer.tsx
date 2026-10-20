'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Scene, Project } from '@cineflow/shared';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  Film,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface VideoPlayerProps {
  scene: Scene | null;
  project: Project | null;
  onRefresh?: () => void;
}

export function VideoPlayer({ scene, project }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'scene' | 'final'>('scene');

  const activeVideoUrl =
    viewMode === 'final' && project?.finalRenderUrl
      ? project.finalRenderUrl
      : scene?.playbackUrl;

  const isGenerating = scene?.status === 'running' || scene?.status === 'queued';

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [activeVideoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  // Determine aspect ratio class
  const aspectRatioClass =
    scene?.aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[500px]'
      : scene?.aspectRatio === '1:1'
      ? 'aspect-square max-h-[480px]'
      : 'aspect-video w-full';

  return (
    <div className="flex-1 flex flex-col bg-cine-950 p-6 items-center justify-center relative overflow-hidden">
      {/* Top Bar: View Mode Switcher & Clip Download */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('scene')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'scene'
                ? 'bg-cine-800 text-amber-400 border border-cine-700'
                : 'text-cine-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Current Scene ({scene ? scene.title : 'None'})</span>
          </button>

          {project?.finalRenderUrl && (
            <button
              onClick={() => setViewMode('final')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'final'
                  ? 'bg-cine-800 text-amber-400 border border-cine-700'
                  : 'text-cine-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Assembled Film</span>
            </button>
          )}
        </div>

        {activeVideoUrl && (
          <a
            href={activeVideoUrl}
            download={`cineflow_${scene?.id || 'video'}.mp4`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cine-850 hover:bg-cine-800 border border-cine-700 text-xs text-cine-200 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download MP4</span>
          </a>
        )}
      </div>

      {/* Main Video Screen Container */}
      <div className="w-full max-w-4xl relative flex items-center justify-center bg-black/60 rounded-2xl overflow-hidden border border-cine-800 shadow-2xl">
        {/* State 1: Generating with Veo */}
        {isGenerating ? (
          <div className="w-full aspect-video flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-cine-900 to-cine-950">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-1">
              Google Vertex AI Veo Generating Video
            </h3>
            <p className="text-xs text-cine-400 max-w-md mb-6">
              Synthesizing cinematic frames, camera path, and lighting coherence. Long-running operation is being tracked.
            </p>
            <div className="w-64 h-1.5 bg-cine-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 animate-pulse w-3/4" />
            </div>
          </div>
        ) : scene?.status === 'failed' ? (
          /* State 2: Generation Failed */
          <div className="w-full aspect-video flex flex-col items-center justify-center p-8 text-center bg-cine-900">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-1">Generation Failed</h3>
            <p className="text-xs text-rose-300/80 max-w-md mb-4 font-mono">
              {scene.errorMessage || 'Unknown error occurred during Vertex AI generation.'}
            </p>
          </div>
        ) : activeVideoUrl ? (
          /* State 3: Ready for Playback */
          <div className={`relative flex items-center justify-center ${aspectRatioClass}`}>
            <video
              ref={videoRef}
              src={activeVideoUrl}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
            />

            {/* Overlay Play/Pause toggle on hover */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:scale-110 transition-transform"
              >
                <Play className="w-7 h-7 fill-current ml-1" />
              </button>
            )}
          </div>
        ) : (
          /* State 4: Draft Prompt ready to be generated */
          <div className="w-full aspect-video flex flex-col items-center justify-center p-8 text-center bg-cine-900/60">
            <div className="w-16 h-16 rounded-2xl bg-cine-800 border border-cine-700 flex items-center justify-center mb-4 text-cine-400">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="font-display text-base font-semibold text-white mb-1">
              Scene Ready for Veo Generation
            </h3>
            <p className="text-xs text-cine-400 max-w-md">
              Configure camera, lighting, and prompt in the editor below, then click &quot;Generate Scene&quot;.
            </p>
          </div>
        )}
      </div>

      {/* Scrub Bar & Player Controls */}
      {activeVideoUrl && (
        <div className="w-full max-w-4xl mt-3 p-3 bg-cine-900 border border-cine-800 rounded-xl flex flex-col gap-2">
          {/* Progress Slider */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-cine-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex items-center justify-between text-xs text-cine-300">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-1.5 hover:text-white hover:bg-cine-800 rounded-lg transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                className="p-1.5 hover:text-white hover:bg-cine-800 rounded-lg transition-colors"
                title="Rewind"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 font-mono text-[11px] text-cine-400">
                <span className="text-white">{currentTime.toFixed(1)}s</span>
                <span>/</span>
                <span>{duration.toFixed(1)}s</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:text-white hover:bg-cine-800 rounded-lg transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:text-white hover:bg-cine-800 rounded-lg transition-colors"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
