"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.needsPasswordReset) {
          router.push(`/reset-password?userId=${data.userId}`);
        } else {

          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border-custom p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome Back</h1>
        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Log In
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-zinc-400">
          Don&apos;t have an account? <a href="/register" className="text-primary-500 hover:underline">Register</a>
        </div>
      </div>
    </div>
  );
}
