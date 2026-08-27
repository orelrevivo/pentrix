"use client";

import React, { useState, useEffect } from "react";
import { OwnerDashboard } from "@/components/OwnerDashboard";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("owner_user_id");
    if (id) {
      setUserId(id);
    }
  }, []);

  if (!userId) return null;

  return (
    <OwnerDashboard
      userId={userId}
    />
  );
}
