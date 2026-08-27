"use client";

import React, { useState, useEffect } from "react";
import { CanvasBoard } from "@/components/CanvasBoard";
import { ProjectSidebar } from "@/components/ProjectSidebar";
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
            }).catch(console.error);
          }
        }

        if (updated) {
          localStorage.setItem("buildboard_views", JSON.stringify(views));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBalance = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/balance?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProjects();
    const userId = localStorage.getItem("owner_user_id");
    if (userId) {
      setIsLoggedIn(true);
      fetchBalance(userId);
    }
  }, []);

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);

    const clicksStr = localStorage.getItem("buildboard_clicks") || "{}";
    const clicks = JSON.parse(clicksStr);

    if (!clicks[project.id]) {
      clicks[project.id] = true;
      localStorage.setItem("buildboard_clicks", JSON.stringify(clicks));
      fetch(`/api/projects/${project.id}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "click" }),
      }).catch(console.error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] w-full overflow-hidden relative">
      <div className={`${selectedProject ? 'flex absolute inset-0 z-50 md:relative md:z-auto' : 'hidden md:flex'} w-full md:w-[420px] shrink-0 border-r border-border-custom bg-background flex-col justify-between overflow-y-auto`}>
        {selectedProject ? (
          <ProjectSidebar
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        ) : (
          <>
            <div className="space-y-6 p-4">
              {isLoggedIn && (
                <div className="space-y-2">
                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-500">Feedback Earnings</p>
                    <p className="text-2xl font-extrabold mt-1">${balance}</p>
                  </div>
                  <p className="text-xs text-zinc-550 italic font-medium text-center">
                    "You can only use the money you earn from the platform to create a spot."
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <p className="text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed">
                  Add your project to a visual board of people building on the internet. Get discovered, get feedback, and show what you are working on.
                </p>
                <Button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("open-create-modal"))}
                  variant="outline"
                  className="min-h-11 gap-2"
                  aria-controls="feedback-title"
                >
                  Create Your Spot
                </Button>
              </div>
              <div id="how-it-works" className="border-t border-border-custom pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">How it works</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Choose a plan, submit your startup details, pay via PayPal, and get placed on the interactive board.
                </p>
              </div>
              <div id="pricing" className="border-t border-border-custom pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pricing</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div className="p-2 rounded bg-card border border-border-custom text-foreground">
                    <p className="font-bold">Small Spot</p>
                    <p className="text-primary-500 font-extrabold">$1</p>
                  </div>
                  <div className="p-2 rounded bg-card border border-border-custom text-foreground">
                    <p className="font-bold">Builder Spot</p>
                    <p className="text-primary-500 font-extrabold">$5</p>
                  </div>
                  <div className="p-2 rounded bg-card border border-border-custom text-foreground">
                    <p className="font-bold">Featured Spot</p>
                    <p className="text-amber-500 font-extrabold">$20</p>
                  </div>
                  <div className="p-2 rounded bg-card border border-border-custom text-foreground">
                    <p className="font-bold">Premium Spot</p>
                    <p className="text-primary-600 font-extrabold">$50</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex-grow relative h-full">
        <CanvasBoard
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={handleSelectProject}
          focusProject={focusProject}
        />
      </div>
    </div>
  );
}
