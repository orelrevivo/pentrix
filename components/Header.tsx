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
    const userId = localStorage.getItem("owner_user_id");
    setIsLoggedIn(!!userId);

    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("owner_user_id"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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

  const handleLogout = () => {
    localStorage.removeItem("owner_user_id");
    setIsLoggedIn(false);
    router.push("/");
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-custom bg-background/80 text-foreground backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" width={130} height={130} alt="" className={theme === "light" ? "block" : "hidden"} />
            <img src="/logo-dark.png" width={130} height={130} alt="" className={theme === "dark" ? "block" : "hidden"} />
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

        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleTheme}
            className="text-zinc-500 hover:text-foreground hover:bg-zinc-900/10 transition-colors"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          {isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="text-zinc-500 hover:text-foreground transition-colors"
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-rose-500 hover:text-rose-600 transition-colors"
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className="text-zinc-500 hover:text-foreground transition-colors"
            >
              Sign In
            </Button>
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
