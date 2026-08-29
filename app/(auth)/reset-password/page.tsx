"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("Invalid reset link. Please log in again.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword }),
      });
      const data = await res.json();
      if (data.success) {

        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border-custom p-8 rounded-2xl shadow-xl">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V7m0 0a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Set a New Password</h1>
          <p className="text-sm text-zinc-400 mt-2">
            For your security, please choose a new password before continuing.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-4 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save New Password & Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
