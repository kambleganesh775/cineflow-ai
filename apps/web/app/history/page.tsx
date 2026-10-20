'use client';

import React, { useState, useEffect } from 'react';
import { GenerationJob, Project } from '@cineflow/shared';
import { api } from '../../lib/api';
import {
  History,
  Play,
  Download,
  AlertCircle,
  Clock,
  Coins,
  Cpu,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function HistoryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const list = await api.getProjects();
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
          const jobList = await api.getJobs(list[0].id);
          setJobs(jobList);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleSelectProject = async (id: string) => {
    setSelectedProjectId(id);
    try {
      setIsLoading(true);
      const jobList = await api.getJobs(id);
      setJobs(jobList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      const retried = await api.retryJob(jobId);
      setJobs((prev) => prev.map((j) => (j.id === retried.id ? retried : j)));
      alert('Job retried and re-queued!');
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-cine-950 p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-amber-400" />
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                Generation History
              </h1>
            </div>
            <p className="text-xs text-cine-400">
              Audit trail of all Vertex AI Veo generation operations, costs, and output storage URIs.
            </p>
          </div>

          {/* Project filter */}
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="bg-cine-900 border border-cine-800 rounded-xl px-3 py-2 text-xs text-cine-200 focus:outline-none focus:border-amber-400"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="text-center py-20 text-cine-400 text-xs">Loading generation history...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-cine-900 border border-cine-800 rounded-2xl p-8">
            <Clock className="w-10 h-10 text-cine-600 mx-auto mb-2" />
            <h3 className="font-display text-sm font-semibold text-white mb-1">No Generation Jobs Recorded</h3>
            <p className="text-xs text-cine-400">
              When you generate video scenes with Veo, their full execution history and cost logs will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-cine-900 border border-cine-800 rounded-xl p-4 flex items-center justify-between gap-4 text-xs hover:border-cine-700 transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white truncate">
                      Job #{job.id.slice(0, 8)}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cine-800 text-amber-400 border border-cine-700">
                      {job.modelId}
                    </span>
                    {job.status === 'completed' && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                    {job.status === 'running' && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse font-semibold">
                        Running ({job.progressPercent}%)
                      </span>
                    )}
                    {job.status === 'failed' && (
                      <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        Failed
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-cine-400 flex items-center gap-3">
                    <span className="font-mono">Created: {new Date(job.createdAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-400 font-mono">
                      <Coins className="w-3 h-3" />
                      Cost: ${job.estimatedCostUsd.toFixed(2)} USD
                    </span>
                  </div>

                  {job.errorMessage && (
                    <p className="text-[11px] text-rose-400 font-mono">{job.errorMessage}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {job.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(job.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cine-800 hover:bg-cine-700 text-cine-200 text-xs font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}

                  {job.downloadUrl && (
                    <a
                      href={job.downloadUrl}
                      download={`scene_${job.sceneId}.mp4`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cine-850 hover:bg-cine-800 border border-cine-700 text-amber-400 text-xs font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Clip</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
