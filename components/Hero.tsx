import React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "./ui";

interface HeroProps {
  onCreateClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCreateClick }) => {
  return (
    <section className="relative overflow-hidden bg-background py-16 sm:py-24 border-b border-border-custom transition-colors duration-300">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--card-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--card-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3.5 py-1.5 text-sm font-medium text-primary-400 dark:text-primary-300 mb-6">
          <Sparkles className="h-4 w-4" />
          <span>Interactive Live Canvas</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-zinc-500">
          Buy a spot on the live builder canvas.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-zinc-400 leading-relaxed">
          Add your project to a visual board of people building on the internet. Get discovered, get feedback, and show what you are working on.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button
            size="lg"
            onClick={onCreateClick}
          >
            Create Your Spot
          </Button>
          <a href="#how-it-works" className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white transition-colors">
            Learn more <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};
