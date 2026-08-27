"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditProjectForm } from "@/components/EditProjectForm";

export default function EditSpotPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("owner_user_id");
    if (id) {
      setUserId(id);
      fetchProject(params.id as string);
    } else {
      router.push("/login");
    }
  }, [params.id, router]);

  const fetchProject = async (projectId: string) => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.success) {
        const found = data.projects.find((p: any) => p.id === projectId);
        setProject(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Spot</h1>
      <EditProjectForm
        project={project}
        onBack={() => router.push("/dashboard")}
        onSuccess={() => router.push("/dashboard")}
      />
    </div>
  );
}
