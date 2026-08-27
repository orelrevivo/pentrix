"use client";

import React, { useState, useEffect } from "react";
import { Edit, Eye, MousePointerClick, RefreshCw, Plus, MapPin } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui";

interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  screenshotUrl?: string;
  founderName: string;
  category: string;
  status: string;
  lookingFor: string;
  plan: string;
  isPublished: boolean;
  views: number;
  clicks: number;
}

interface OwnerDashboardProps {
  userId: string;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  userId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async (ownerId: string) => {
    try {
      const res = await fetch(`/api/dashboard/projects?ownerId=${ownerId}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProjects(userId);
    }
  }, [userId]);

  const togglePublish = async (project: Project) => {
    try {
      const res = await fetch(`/api/dashboard/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !project.isPublished }),
      });
      const data = await res.json();
      if (data.success && userId) {
        fetchProjects(userId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-card rounded-lg p-4 md:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border-custom pb-4 mb-6 gap-4">
        <div className="w-full">
          <h2 className="text-2xl font-bold text-foreground">Your Projects</h2>
          <p className="text-sm text-zinc-500 mt-1">Manage and monitor your active spots on the board</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => window.dispatchEvent(new Event("open-create-modal"))} className="flex-1 md:flex-none justify-center gap-2">
            <Plus className="h-4 w-4 shrink-0" />
            <span className="truncate">Buy Another Spot</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchProjects(userId)}
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 text-sm">No projects found. Buy your first spot to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl border border-border-custom bg-card-muted p-5 gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={project.logoUrl}
                  alt={project.name}
                  className="h-12 w-12 rounded-xl object-cover border border-border-custom"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-base">{project.name}</h3>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-500 border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 rounded">
                      {project.plan} spot
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{project.tagline}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={project.status} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-4 md:mt-0 w-full md:w-auto border-t border-border-custom md:border-t-0 pt-4 md:pt-0">
                <div className="flex items-center gap-4 text-zinc-500 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-zinc-500" />
                    <span>{project.views} Views</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MousePointerClick className="h-4 w-4 text-zinc-500" />
                    <span>{project.clicks} Clicks</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {project.isPublished && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/?locate=${project.id}`}
                      className="gap-1 flex-1 sm:flex-none"
                    >
                      <MapPin className="h-3.5 w-3.5 text-primary-500 hidden sm:block" />
                      <span className="sm:hidden">Locate</span>
                      <span className="hidden sm:inline">Locate on Canvas</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublish(project)}
                    className={`flex-1 sm:flex-none ${project.isPublished ? "border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}
                  >
                    {project.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.location.href = `/dashboard/${project.id}`}
                    className="gap-1 flex-1 sm:flex-none"
                  >
                    <Edit className="h-3.5 w-3.5 hidden sm:block" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
