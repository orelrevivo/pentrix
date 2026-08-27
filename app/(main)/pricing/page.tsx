"use client";

import React from "react";
import { Check, Star, Shield, Award, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { Features } from "@/components/blocks/features-8";
import * as PricingCard from "@/components/ui/pricing-card";

const PLANS = [
  {
    id: "small",
    name: "Small Spot",
    price: 1,
    icon: Award,
    color: "border-zinc-800 text-zinc-400 bg-zinc-950/20",
    features: [
      "Small tile spot",
      "Displays logo & name",
      "Status indicator",
      "Direct website link",
    ],
  },
  {
    id: "builder",
    name: "Builder Spot",
    price: 5,
    icon: Shield,
    color: "border-zinc-700 text-zinc-300 bg-zinc-900/40",
    features: [
      "Larger tile spot",
      "Displays logo & tagline",
      "Category tag & Status",
      "Direct website link",
    ],
  },
  {
    id: "featured",
    name: "Featured Spot",
    price: 20,
    icon: Star,
    color: "border-amber-500/50 text-amber-400 bg-amber-500/5",
    features: [
      "Bigger tile size",
      "Highlighted border effect",
      "Closer to the center",
      "Full sidebar preview",
      "Priority customer support",
    ],
    featured: true,
  },
  {
    id: "premium",
    name: "Premium Spot",
    price: 50,
    icon: Sparkles,
    color: "border-primary-500/50 text-primary-400 bg-primary-500/5",
    features: [
      "Largest tile size",
      "Featured glowing animation",
      "Maximum board visibility",
      "Priority placement near center",
      "Detailed analytics view",
      "Lifetime updates",
    ],
  },
];



export default function PricingPage() {
  const handleOpenModal = () => {
    window.dispatchEvent(new Event("open-create-modal"));
  };

  return (
    <div className="flex-1 w-full bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0099ff] to-primary-500">
          Simple, Transparent Pricing
        </h1>
        <p className="text-sm text-zinc-500 max-w-xl mx-auto">
          Secure a spot on the live builder board. Get discovered, get premium feedback, and showcase what you are building. One-time payment, lifetime placement.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <PricingCard.Card key={plan.id} className={plan.featured ? "ring-1 ring-[#0099ff]" : ""}>
              <PricingCard.Header glassEffect={true}>
                <PricingCard.Plan>
                  <PricingCard.PlanName>
                    <Icon aria-hidden="true" className={plan.featured ? "text-[#0099ff]" : "text-text-muted"} />
                    <span className="text-text-main font-bold">{plan.name}</span>
                  </PricingCard.PlanName>
                  {plan.featured && <PricingCard.Badge className="border-[#0099ff] text-[#0099ff]">Popular</PricingCard.Badge>}
                </PricingCard.Plan>
                <PricingCard.Price>
                  <PricingCard.MainPrice className="text-text-main">${plan.price}</PricingCard.MainPrice>
                  <PricingCard.Period className="text-text-muted">/one-time</PricingCard.Period>
                </PricingCard.Price>
                <Button
                  onClick={handleOpenModal}
                  variant={plan.featured ? "default" : "outline"}
                  className="w-full font-semibold"
                >
                  Buy Spot
                </Button>
              </PricingCard.Header>
              <PricingCard.Body>
                <PricingCard.List>
                  {plan.features.map((feature, idx) => (
                    <PricingCard.ListItem key={idx}>
                      <span className="mt-0.5">
                        <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                      </span>
                      <span className="text-text-muted text-xs">{feature}</span>
                    </PricingCard.ListItem>
                  ))}
                </PricingCard.List>
              </PricingCard.Body>
            </PricingCard.Card>
          );
        })}
      </div>
      <div className="border-t border-border-custom pt-12">
        <div className="text-center space-y-2">
          <h2 className="text-4xl tracking-tight">How the Platform Works</h2>
        </div>
        <Features />
      </div>
    </div>
  );
}
