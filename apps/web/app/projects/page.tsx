'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '@cineflow/shared';
import { api } from '../../lib/api';
import {
  FolderKanban,
  Plus,
  Film,
  Clock,
  Trash2,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { NewProjectModal } from '../../components/NewProjectModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleCreate = async (data: any) => {
    const created = await api.createProject(data);
    setProjects([created, ...projects]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-cine-950 p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="w-5 h-5 text-amber-400" />
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                My Projects
              </h1>
            </div>
            <p className="text-xs text-cine-400">
              Manage multi-scene cinematic video projects and persistent timeline edits.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-cine-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-cine-400 text-xs">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 bg-cine-900 border border-cine-800 rounded-2xl p-8">
            <Film className="w-12 h-12 text-cine-600 mx-auto mb-3" />
            <h3 className="font-display text-base font-semibold text-white mb-1">No Projects Found</h3>
            <p className="text-xs text-cine-400 max-w-sm mx-auto mb-4">
              Create your first multi-scene video project to start generating with Google Veo.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-cine-950 text-xs font-bold"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-cine-900 border border-cine-800 rounded-2xl p-5 flex flex-col justify-between hover:border-cine-700 transition-all group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                      {project.name}
                    </h3>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="p-1.5 text-cine-500 hover:text-rose-400 rounded-lg hover:bg-cine-850 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-cine-400 line-clamp-2 mb-4 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-cine-850 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-cine-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>{project.sceneCount || 0} scenes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cine-400" />
                      <span>{project.totalDurationSeconds || 0}s duration</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-cine-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </span>

                    <Link
                      href="/"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cine-850 hover:bg-cine-800 text-amber-400 text-xs font-semibold transition-all border border-cine-800"
                    >
                      <span>Open Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
