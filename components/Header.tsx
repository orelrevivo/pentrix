"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon, Menu, X } from "lucide-react";
import { Button } from "./ui";

export const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setIsLoggedIn(data.authenticated))
      .catch(() => setIsLoggedIn(false));

    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    router.push("/");
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-custom bg-background/80 text-foreground backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="https://falbor.xyz" target="_blank" className="flex items-center gap-2.5">
            <img src="/logo-light-styled.png" width={130} height={130} alt="" className={theme === "light" ? "block" : "hidden"} />
            <img src="/logo-dark-styled.png" width={130} height={130} alt="" className={theme === "dark" ? "block" : "hidden"} />
          </Link>
          <span className="w-px bg-gray-300 h-8" />
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" width={130} height={130} alt="" className={theme === "light" ? "block" : "hidden"} />
            <img src="/logo-dark.png" width={130} height={130} alt="" className={theme === "dark" ? "block" : "hidden"} />
          </Link>
          <Link href="/contact" className="text-zinc-550 hover:text-foreground text-sm font-semibold transition-colors ml-4 shrink-0">
            Contact
          </Link>
          <Link href="/pricing" className="text-zinc-550 hover:text-foreground text-sm font-semibold transition-colors ml-4 shrink-0">
            Pricing
          </Link>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleTheme}
            className="text-zinc-500 hover:text-foreground"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-zinc-500 hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleTheme}
            className="text-zinc-500 hover:text-foreground w-9 h-9 transition-colors"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-zinc-500 hover:text-foreground transition-colors px-2 py-1.5"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors px-2 py-1.5 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-500 hover:text-foreground transition-colors px-2 py-1.5"
            >
              Sign In
            </Link>
          )}
          <Button onClick={() => window.dispatchEvent(new Event("open-create-modal"))}>
            Create Your Spot
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border-custom bg-background px-4 py-4 space-y-4 shadow-xl">
          {isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                onClick={() => { setMobileMenuOpen(false); router.push("/dashboard"); }}
                className="w-full justify-start text-zinc-500 hover:text-foreground"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full justify-start text-rose-500 hover:text-rose-600"
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => { setMobileMenuOpen(false); router.push("/login"); }}
              className="w-full justify-start text-zinc-500 hover:text-foreground"
            >
              Sign In
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => { setMobileMenuOpen(false); router.push("/contact"); }}
            className="w-full justify-start text-zinc-500 hover:text-foreground"
          >
            Contact
          </Button>
          <Button
            variant="ghost"
            onClick={() => { setMobileMenuOpen(false); router.push("/pricing"); }}
            className="w-full justify-start text-zinc-500 hover:text-foreground"
          >
            Pricing
          </Button>
          <Button
            className="w-full"
            onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new Event("open-create-modal")); }}
          >
            Create Your Spot
          </Button>
        </div>
      )}
    </header>
  );
};
