"use client";

import React, { useState, useEffect } from "react";
import { GameBoard } from "@/components/GameBoard";
import { PhoneOverlay } from "@/components/PhoneOverlay";
import { Button } from "@/components/ui";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [focusProject, setFocusProject] = useState<any | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState("0.00");

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects);

        const viewsStr = localStorage.getItem("buildboard_views") || "{}";
        const views = JSON.parse(viewsStr);
        let updated = false;

        for (const proj of data.projects) {
          if (!views[proj.id]) {
            views[proj.id] = true;
            updated = true;
            fetch(`/api/projects/${proj.id}/stats`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "view" }),
            }).catch(() => {});
          }
        }

        if (updated) {
          localStorage.setItem("buildboard_views", JSON.stringify(views));
        }
      }
    } catch (_) {

    }
  };

  const fetchBalance = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/balance?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (_) {

    }
  };

  useEffect(() => {
    fetchProjects();
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setIsLoggedIn(true);
          fetchBalance(data.userId);
        }
      });
  }, []);

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
    if (!project) return;

    const clicksStr = localStorage.getItem("buildboard_clicks") || "{}";
    const clicks = JSON.parse(clicksStr);

    if (!clicks[project.id]) {
      clicks[project.id] = true;
      localStorage.setItem("buildboard_clicks", JSON.stringify(clicks));
      fetch(`/api/projects/${project.id}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "click" }),
      }).catch(() => {});
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden relative bg-zinc-950">
      {/* 3D Game takes up full screen now */}
      <div className="absolute inset-0">
        <GameBoard
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={handleSelectProject}
          focusProject={focusProject}
        />
      </div>

      {/* Floating Dashboard (Earnings & Create Spot) - Hidden when phone is open */}
      {!selectedProject && (
        <div className="absolute top-6 left-6 z-40 space-y-4 max-w-xs pointer-events-none">
          {isLoggedIn && (
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/80 backdrop-blur-md text-emerald-600 dark:text-emerald-400 shadow-xl pointer-events-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-500">Feedback Earnings</p>
              <h3 className="text-3xl font-black mt-1 tracking-tight">${balance}</h3>
              <p className="text-[10px] italic opacity-80 mt-2 leading-relaxed">
                *You can only use the money you earn from the platform to create a spot.*
              </p>
            </div>
          )}
          
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-md shadow-xl pointer-events-auto">
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Add your project to a visual board of people building on the internet. Get discovered, get feedback, and show what you are working on.
            </p>
            <Button 
              variant="outline" 
              className="w-full justify-center bg-zinc-950 hover:bg-zinc-800 text-white font-medium shadow-sm transition-all"
              onClick={() => {
                if (isLoggedIn) {
                  window.location.href = '/dashboard/create-spot';
                } else {
                  window.location.href = '/login?redirect=/dashboard/create-spot';
                }
              }}
            >
              Create Your Spot
            </Button>
          </div>
        </div>
      )}

      {/* Phone UI Animation Overlay */}
      {selectedProject && (
        <PhoneOverlay 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  );
}
