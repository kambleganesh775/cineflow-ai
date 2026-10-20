'use client';

import React from 'react';
import { Project } from '@cineflow/shared';
import {
  Plus,
  FolderOpen,
  Coins,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Info,
  Wand2,
} from 'lucide-react';

interface HeaderProps {
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onOpenCreditModal: () => void;
  onOpenOmniModal: () => void;
}

export function Header({
  currentProject,
  projects,
  onSelectProject,
  onNewProject,
  onOpenCreditModal,
  onOpenOmniModal,
}: HeaderProps) {
  return (
    <header className="h-16 bg-cine-900 border-b border-cine-800 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Project Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-cine-850 border border-cine-800 hover:border-cine-700 cursor-pointer transition-all">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white max-w-[200px] truncate">
              {currentProject ? currentProject.name : 'Select Project'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-cine-400" />
          </div>

          {/* Switcher dropdown */}
          <div className="absolute left-0 mt-1 w-64 bg-cine-900 border border-cine-700 rounded-xl shadow-2xl py-1.5 hidden group-hover:block z-50">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-cine-400 tracking-wider">
              Switch Project
            </div>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-cine-800 transition-colors ${
                  currentProject?.id === p.id ? 'text-amber-400 font-semibold bg-cine-850' : 'text-cine-300'
                }`}
              >
                <span className="truncate">{p.name}</span>
                <span className="text-[10px] text-cine-400">{p.sceneCount || 0} scenes</span>
              </button>
            ))}
            <div className="border-t border-cine-800 mt-1 pt-1 px-2">
              <button
                onClick={onNewProject}
                className="w-full text-left px-2 py-1.5 text-xs text-amber-400 flex items-center gap-2 hover:bg-cine-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Project</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cine-800 hover:bg-cine-700 text-xs font-medium text-cine-200 hover:text-white transition-all border border-cine-700"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>

        <button
          onClick={onOpenOmniModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 via-fuchsia-500/20 to-amber-500/20 hover:from-purple-500/30 hover:to-amber-500/30 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Omni Director</span>
        </button>
      </div>

      {/* Right side: Safety & Credit Badges */}
      <div className="flex items-center gap-3">
        {/* Credit Protection badge */}
        <button
          onClick={onOpenCreditModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 transition-all text-xs font-medium cursor-pointer"
          title="Verify Google Cloud Trial Credits and Veo Billing Eligibility"
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Credits: ~$300 Potential</span>
          <Info className="w-3 h-3 text-amber-500/70" />
        </button>

        {/* Strict Spending Safeguard Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cost Confirmation Active</span>
        </div>
      </div>
    </header>
  );
}
