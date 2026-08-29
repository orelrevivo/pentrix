"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OwnerDashboard } from "@/components/OwnerDashboard";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUserId(data.userId);
        } else {
          router.push("/login");
        }
      });
  }, [router]);

  if (!userId) return null;

  return (
    <OwnerDashboard
      userId={userId}
    />
  );
}
