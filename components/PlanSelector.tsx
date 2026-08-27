import React from "react";
import { Check, Star, Shield, Award } from "lucide-react";

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  icon: any;
  color: string;
}

export const PLANS: Plan[] = [
  {
    id: "small",
    name: "Small Spot",
    price: 1,
    icon: Award,
    color: "border-zinc-800 text-zinc-400 bg-zinc-950",
    features: ["Small tile spot", "Displays logo & name", "Status indicator", "Direct website link"],
  },
  {
    id: "builder",
    name: "Builder Spot",
    price: 5,
    icon: Shield,
    color: "border-zinc-700 text-zinc-300 bg-zinc-900/50",
    features: ["Larger tile spot", "Displays logo & tagline", "Category tag & Status", "Direct website link"],
  },
  {
    id: "featured",
    name: "Featured Spot",
    price: 20,
    icon: Star,
    color: "border-amber-500/50 text-amber-400 bg-amber-500/5",
    features: ["Bigger tile size", "Highlighted border effect", "Closer to the center", "Full sidebar preview"],
  },
  {
    id: "premium",
    name: "Premium Spot",
    price: 50,
    icon: Star,
    color: "border-primary-500/50 text-primary-400 bg-primary-500/5",
    features: ["Largest tile size", "Featured glowing animation", "Maximum board visibility", "Priority placement near center", "Detailed analytics view"],
  },
];

interface PlanSelectorProps {
  selectedPlan: string;
  onSelectPlan: (planId: string) => void;
  couponApplied?: boolean;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({ selectedPlan, onSelectPlan, couponApplied }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {PLANS.map((plan) => {
        const Icon = plan.icon;
        const isSelected = selectedPlan === plan.id;
        return (
          <div
            key={plan.id}
            onClick={() => onSelectPlan(plan.id)}
            className={`flex flex-col justify-between rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${isSelected ? "ring-2 ring-primary-500 border-primary-500" : "border-zinc-800 bg-zinc-900/30"} ${plan.color}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6" />
                {isSelected && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{plan.name}</h3>
              <p className="mt-2 text-2xl font-extrabold text-white">
                {couponApplied && plan.id === "small" ? "FREE" : `$${plan.price}`}
                <span className="text-sm font-normal text-zinc-500"> /one-time</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-xs text-zinc-400 gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};
