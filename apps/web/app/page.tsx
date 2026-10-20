'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Project, Scene, DEFAULT_VEO_MODEL, calculateVeoCost } from '@cineflow/shared';
import { api } from '../lib/api';
import { Header } from '../components/Header';
import { VideoPlayer } from '../components/VideoPlayer';
import { SceneEditor } from '../components/SceneEditor';
import { Timeline } from '../components/Timeline';
import { InspectorPanel } from '../components/InspectorPanel';
import { BillingConfirmModal } from '../components/BillingConfirmModal';
import { CreditGuidanceModal } from '../components/CreditGuidanceModal';
import { NewProjectModal } from '../components/NewProjectModal';
import { Loader2 } from 'lucide-react';

export default function StudioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<(Project & { scenes: Scene[] }) | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);

  // Modals
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{
    type: 'single' | 'all';
    sceneId?: string;
  } | null>(null);

  // Load projects on mount
  const loadProjects = useCallback(async (selectId?: string) => {
    try {
      setIsLoading(true);
      const list = await api.getProjects();
      setProjects(list);

      let targetId = selectId || list[0]?.id;

      if (!targetId && list.length === 0) {
        // Create initial default cinematic starter project
        const starter = await api.createProject({
          name: 'Neon Odyssey',
          description: 'A cinematic cyber-noir journey through illuminated streets.',
          settings: {
            defaultModelId: DEFAULT_VEO_MODEL,
            defaultAspectRatio: '16:9',
            defaultResolution: '720p',
            defaultDurationSeconds: 5,
          },
        });

        // Add 2 initial scenes
        await api.createScene(starter.id, {
          title: 'Opening Alleyway',
          prompt: 'Cinematic wide angle drone shot flying through a rain-soaked cyberpunk alley with glowing holographic advertisements reflected in water ripples.',
          cameraMovement: 'Low Angle Tracking',
          lighting: 'Cyberpunk Neon Ambient',
          visualStyle: 'Cinematic Photorealistic 35mm',
          aspectRatio: '16:9',
          durationSeconds: 5,
          resolution: '720p',
        });

        await api.createScene(starter.id, {
          title: 'The Cyber-Deck Encounter',
          prompt: 'Medium close-up shot of an enigmatic hacker in a high-collar trench coat inspecting glowing data nodes under neon lights, volumetric mist.',
          cameraMovement: 'Slow Zoom In',
          lighting: 'Moody Noir High Contrast',
          visualStyle: 'Anamorphic Film Grain',
          aspectRatio: '16:9',
          durationSeconds: 5,
          resolution: '720p',
        });

        targetId = starter.id;
        const refreshedList = await api.getProjects();
        setProjects(refreshedList);
      }

      if (targetId) {
        const fullProj = await api.getProject(targetId);
        setCurrentProject(fullProj);
        if (fullProj.scenes.length > 0) {
          setSelectedSceneId(fullProj.scenes[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Polling loop for active scene generations & renders
  useEffect(() => {
    const hasActiveScenes = currentProject?.scenes.some(
      (s) => s.status === 'running' || s.status === 'queued'
    );

    if (!hasActiveScenes && !isRendering) return;

    const interval = setInterval(async () => {
      if (!currentProject) return;
      try {
        const refreshed = await api.getProject(currentProject.id);
        setCurrentProject(refreshed);

        if (refreshed.finalRenderUrl && isRendering) {
          setIsRendering(false);
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentProject, isRendering]);

  // Project handlers
  const handleSelectProject = async (id: string) => {
    try {
      const full = await api.getProject(id);
      setCurrentProject(full);
      setSelectedSceneId(full.scenes[0]?.id || null);
    } catch (err: any) {
      alert(`Could not load project: ${err.message}`);
    }
  };

  const handleCreateProject = async (data: any) => {
    const created = await api.createProject(data);
    await loadProjects(created.id);
  };

  // Scene handlers
  const currentScene = currentProject?.scenes.find((s) => s.id === selectedSceneId) || null;

  const handleUpdateScene = async (updates: Partial<Scene>) => {
    if (!selectedSceneId || !currentProject) return;
    try {
      const updated = await api.updateScene(selectedSceneId, updates);
      setCurrentProject({
        ...currentProject,
        scenes: currentProject.scenes.map((s) => (s.id === updated.id ? updated : s)),
      });
    } catch (err: any) {
      console.error('Failed to update scene:', err);
    }
  };

  const handleAddScene = async () => {
    if (!currentProject) return;
    try {
      const newScene = await api.createScene(currentProject.id, {
        title: `Scene ${currentProject.scenes.length + 1}`,
        prompt: 'A cinematic establishing shot...',
        aspectRatio: currentProject.settings.defaultAspectRatio,
        durationSeconds: currentProject.settings.defaultDurationSeconds,
        resolution: currentProject.settings.defaultResolution,
        modelId: currentProject.settings.defaultModelId,
      });

      setCurrentProject({
        ...currentProject,
        scenes: [...currentProject.scenes, newScene],
      });
      setSelectedSceneId(newScene.id);
    } catch (err: any) {
      alert(`Failed to add scene: ${err.message}`);
    }
  };

  const handleMoveScene = async (currentIndex: number, direction: 'left' | 'right') => {
    if (!currentProject) return;
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= currentProject.scenes.length) return;

    const reordered = [...currentProject.scenes];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const sceneIds = reordered.map((s) => s.id);
    try {
      const savedScenes = await api.reorderScenes(currentProject.id, sceneIds);
      setCurrentProject({ ...currentProject, scenes: savedScenes });
    } catch (err: any) {
      alert(`Failed to reorder scenes: ${err.message}`);
    }
  };

  const handleDuplicateScene = async (sceneId: string) => {
    if (!currentProject) return;
    try {
      const duplicated = await api.duplicateScene(sceneId);
      setCurrentProject({
        ...currentProject,
        scenes: [...currentProject.scenes, duplicated],
      });
      setSelectedSceneId(duplicated.id);
    } catch (err: any) {
      alert(`Failed to duplicate scene: ${err.message}`);
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!currentProject) return;
    if (!confirm('Are you sure you want to delete this scene?')) return;

    try {
      await api.deleteScene(sceneId);
      const remaining = currentProject.scenes.filter((s) => s.id !== sceneId);
      setCurrentProject({ ...currentProject, scenes: remaining });
      if (selectedSceneId === sceneId) {
        setSelectedSceneId(remaining[0]?.id || null);
      }
    } catch (err: any) {
      alert(`Failed to delete scene: ${err.message}`);
    }
  };

  // Generation & Billing Safeguard triggers
  const triggerGenerateSingleScene = (sceneId: string) => {
    setPendingGeneration({ type: 'single', sceneId });
    setIsBillingModalOpen(true);
  };

  const triggerGenerateAllScenes = () => {
    setPendingGeneration({ type: 'all' });
    setIsBillingModalOpen(true);
  };

  const executeConfirmedGeneration = async () => {
    if (!pendingGeneration || !currentProject) return;

    try {
      if (pendingGeneration.type === 'single' && pendingGeneration.sceneId) {
        await api.generateScene(pendingGeneration.sceneId, true);
      } else if (pendingGeneration.type === 'all') {
        await api.generateAllScenes(currentProject.id, true);
      }
      const refreshed = await api.getProject(currentProject.id);
      setCurrentProject(refreshed);
    } catch (err: any) {
      alert(`Generation trigger error: ${err.message}`);
    } finally {
      setPendingGeneration(null);
    }
  };

  const handleRenderProject = async () => {
    if (!currentProject) return;
    const completedScenes = currentProject.scenes.filter(
      (s) => s.status === 'completed' && s.videoStorageUri
    );

    if (completedScenes.length === 0) {
      alert('You need at least one completed scene to export the final film.');
      return;
    }

    try {
      setIsRendering(true);
      await api.renderProject(currentProject.id);
      alert('Video assembly initiated! FFmpeg is concatenating and normalizing your scenes.');
    } catch (err: any) {
      setIsRendering(false);
      alert(`Render error: ${err.message}`);
    }
  };

  // Compute estimate for modal
  const pendingCostEstimate = pendingGeneration?.type === 'single' && currentScene
    ? calculateVeoCost(currentScene.modelId, currentScene.durationSeconds, currentScene.resolution)
    : {
        estimatedCostUsd: currentProject?.scenes.reduce((acc, s) => {
          return acc + calculateVeoCost(s.modelId, s.durationSeconds, s.resolution).estimatedCostUsd;
        }, 0) || 0,
        durationSeconds: currentProject?.scenes.reduce((acc, s) => acc + s.durationSeconds, 0) || 0,
        resolution: currentScene?.resolution || '720p',
        modelId: currentScene?.modelId || DEFAULT_VEO_MODEL,
      };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-cine-950 text-white select-none">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-4" />
        <h2 className="font-display text-lg font-bold">Loading CineFlow AI Studio...</h2>
        <p className="text-xs text-cine-400 mt-1">Connecting to Vertex AI Veo and Private Storage</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-cine-950">
      {/* Top Header */}
      <Header
        currentProject={currentProject}
        projects={projects}
        onSelectProject={handleSelectProject}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenCreditModal={() => setIsCreditModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Workspace (Video Player + Scene Editor) */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video Player */}
          <VideoPlayer scene={currentScene} project={currentProject} />

          {/* Scene Prompt & Style Editor */}
          <SceneEditor scene={currentScene} onUpdateScene={handleUpdateScene} />

          {/* Bottom Multi-Scene Timeline */}
          <Timeline
            scenes={currentProject?.scenes || []}
            selectedSceneId={selectedSceneId}
            onSelectScene={(id) => setSelectedSceneId(id)}
            onAddScene={handleAddScene}
            onMoveScene={handleMoveScene}
            onDuplicateScene={handleDuplicateScene}
            onDeleteScene={handleDeleteScene}
          />
        </div>

        {/* Right Inspector Panel */}
        <InspectorPanel
          scene={currentScene}
          project={currentProject}
          onUpdateScene={handleUpdateScene}
          onGenerateScene={triggerGenerateSingleScene}
          onGenerateAll={triggerGenerateAllScenes}
          onRenderProject={handleRenderProject}
          isRendering={isRendering}
        />
      </div>

      {/* Billing Confirmation Modal */}
      <BillingConfirmModal
        isOpen={isBillingModalOpen}
        onClose={() => {
          setIsBillingModalOpen(false);
          setPendingGeneration(null);
        }}
        onConfirm={executeConfirmedGeneration}
        title={
          pendingGeneration?.type === 'single'
            ? `Generate Scene: "${currentScene?.title || ''}"`
            : `Queue All Scenes (${currentProject?.scenes.length || 0} scenes)`
        }
        totalCostUsd={pendingCostEstimate.estimatedCostUsd}
        sceneCount={pendingGeneration?.type === 'single' ? 1 : currentProject?.scenes.length || 1}
        totalDurationSeconds={pendingCostEstimate.durationSeconds}
        resolution={pendingCostEstimate.resolution}
        modelId={pendingCostEstimate.modelId}
      />

      {/* Credit Guidance Modal */}
      <CreditGuidanceModal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        gcpProject="promptwars-494613"
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
