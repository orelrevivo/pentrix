"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button, Input, Textarea, Label, Select } from "@/components/ui";

export default function ContactPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [issueType, setIssueType] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fetchingUser, setFetchingUser] = useState(false);

  useEffect(() => {
    setFetchingUser(true);
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUserId(data.userId);
          return fetch(`/api/users/profile`).then(r => r.json());
        }
        return { success: false };
      })
      .then((data) => {
        if (data.success) {
          setEmail(data.email);
        }
      })
      .catch(() => {})
      .finally(() => setFetchingUser(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          issueType,
          message,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setMessage("");
      } else {
        setError(data.error || "Failed to submit message");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-8rem)] bg-background">
      <div className="w-full max-w-lg border border-border-custom rounded-md p-6 text-foreground">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Contact Support</h2>
          <p className="text-sm text-zinc-500 mt-2">Have a question or issue? We are here to help.</p>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Message Sent Successfully!</h3>
              <p className="text-xs text-zinc-500 mt-1">We will review your inquiry and get back to you shortly.</p>
            </div>
            <Button onClick={() => setSuccess(false)} variant="outline" className="mt-4">
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm text-white/80">Your Email Address</label>
              <Input
                type="email"
                required
                disabled={fetchingUser || !!userId}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-background"
              />
              {userId && (
                <p className="text-[10px] text-zinc-500 mt-1">Pre-filled from your logged in account.</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80">What can we help you with?</label>
              <Select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-background"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Spot issues / Troubleshooting">Spot issues / Troubleshooting</option>
                <option value="Free spot request">Free spot request</option>
                <option value="Feedback system / payout question">Feedback system / payout question</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80">Message Details</label>
              <Textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or request here..."
                className="w-full bg-background"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || fetchingUser}
              className="w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>

            <div className="pt-4 border-t border-border-custom text-center text-xs text-zinc-500 space-y-1">
              <p>For urgent or personal inquiries, email directly to:</p>
              <a href="mailto:contact@falbor.xyz" className="font-semibold text-primary-500 hover:underline flex items-center justify-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                contact@falbor.xyz
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
