import React from "react";
import { StatusBadge } from "./StatusBadge";

interface Project {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  status: string;
  canvasX: number;
  canvasY: number;
  tileSize: string;
  plan: string;
}

interface ProjectTileProps {
  project: Project;
  onClick: () => void;
  isSelected: boolean;
}

export const ProjectTile: React.FC<ProjectTileProps> = ({ project, onClick, isSelected }) => {
  const getGlowClass = (plan: string) => {
    switch (plan) {
      case "premium":
        return "border-primary-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.8)] animate-pulse";
      case "featured":
        return "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)]";
      case "builder":
        return "border-border-custom hover:border-zinc-400 dark:hover:border-zinc-500 shadow-lg";
      default:
        return "border-border-custom hover:border-zinc-300 dark:hover:border-zinc-600 shadow-md";
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("live") || s.includes("working")) return "bg-emerald-500";
    if (s.includes("building") || s.includes("feedback") || s.includes("progress")) return "bg-amber-500";
    if (s.includes("pause") || s.includes("stop") || s.includes("not working")) return "bg-rose-500";
    return "bg-primary-500";
  };

  const size = parseInt(project.tileSize) || 70;

  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: `${project.canvasX}px`,
        top: `${project.canvasY}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
      className={`group relative flex flex-col items-center justify-center rounded-2xl border bg-card backdrop-blur-sm cursor-pointer overflow-hidden ${getGlowClass(project.plan)} ${isSelected ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-black z-30" : "z-10 hover:z-20"}`}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center p-3 text-center">
        <img
          src={project.logoUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
          alt={project.name}
          className="h-10 w-10 rounded-xl object-cover shadow-inner group-hover:scale-105 transition-transform duration-200"
        />
        {size >= 100 && (
          <span className="mt-2 text-xs font-semibold text-foreground truncate w-full px-1">
            {project.name}
          </span>
        )}
        <div className="absolute top-2 right-2 flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor(project.status)}`} />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${getStatusColor(project.status)}`} />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 translate-y-2 rounded-lg border border-border-custom bg-card p-2.5 text-center opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 z-50">
        <p className="text-xs font-bold text-foreground">{project.name}</p>
        <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{project.tagline}</p>
        <div className="mt-1.5 flex justify-center">
          <StatusBadge status={project.status} />
        </div>
      </div>
    </div>
  );
};
