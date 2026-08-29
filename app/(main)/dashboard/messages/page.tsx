"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function MessagesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUserId(data.userId);
          fetchConversations(data.userId);
        } else {
          // We can't use useRouter().push inside useEffect easily without assigning it first
          window.location.href = "/login";
        }
      });
  }, []);

  const fetchConversations = async (uid: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conversationId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch("/api/messages/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, action, founderId: userId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchConversations(userId!);
      }
    } catch (_) {
    }
  };

  if (loading) return <div className="p-8">Loading messages...</div>;

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      <div className="p-4 border-b border-border-custom">
        <h2 className="text-xl font-bold text-foreground">Messages & Feedback</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-zinc-500">No messages yet.</p>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv) => {
              const isReceived = conv.founderId === userId;
              const title = isReceived ? "Received Feedback" : "Sent Feedback";
              const latestMsg = conv.messages && conv.messages.length > 0 ? conv.messages[0].content : "No content";

              return (
                <div key={conv.id} className="p-4 rounded-lg bg-card-muted border border-border-custom flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-foreground">{title} (Project ID: {conv.projectId})</span>
                    <span className={`text-xs px-2 py-1 rounded-md ${conv.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                      conv.status === 'rejected' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                        'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}>
                      {conv.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-foreground bg-card p-3 rounded-md border border-border-custom">
                    {latestMsg}
                  </div>
                  {isReceived && conv.status === "pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleResolve(conv.id, "accept")} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        Accept Feedback (+20¢ to sender)
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleResolve(conv.id, "reject")}>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
