"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CreateProjectModal } from "@/components/CreateProjectModal";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => setIsCreateOpen(true);
    window.addEventListener("open-create-modal", handleOpenModal);
    return () => window.removeEventListener("open-create-modal", handleOpenModal);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <main className="flex-grow overflow-hidden relative">
        {children}
      </main>
      
      {isCreateOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
