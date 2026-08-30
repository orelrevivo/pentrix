"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navItems = [
    { name: "My Spots", href: "/dashboard" },
    { name: "Messages", href: "/dashboard/messages" },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-background flex flex-col">
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-8 h-full">
        <aside className="md:col-span-1 md:h-full overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-hide">
          <nav className="flex flex-row md:flex-col gap-2 min-w-max pb-2 md:pb-0">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${pathname === item.href ? "bg-primary-500/10 text-primary-500" : "text-zinc-500 hover:text-foreground hover:bg-zinc-900/50"}`}
              >
                {item.name}
              </a>
            ))}
          </nav>
        </aside>
        <main className="md:col-span-3 h-full overflow-y-auto pb-20">{children}</main>
      </div>
    </div>
  );
}
