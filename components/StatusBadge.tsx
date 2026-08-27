import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (val: string) => {
    const s = val.toLowerCase();
    if (s.includes("live") || s.includes("working")) {
      return { text: "Live", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    }
    if (s.includes("building") || s.includes("feedback") || s.includes("progress")) {
      return { text: status, bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    }
    if (s.includes("pause") || s.includes("stop") || s.includes("not working")) {
      return { text: status, bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" };
    }
    if (s.includes("user") || s.includes("customer")) {
      return { text: status, bg: "bg-primary-500/10 text-primary-400 border-primary-500/20" };
    }
    return { text: status, bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {config.text}
    </span>
  );
};
