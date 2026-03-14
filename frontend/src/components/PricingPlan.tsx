import React from "react";
import { motion } from "motion/react";
import { Check, Zap, ShieldCheck, Sparkles } from "lucide-react";

interface PricingPlanProps {
  onSelect: (plan: string) => void;
}

export const PricingPlan: React.FC<PricingPlanProps> = ({ onSelect }) => {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "/mo",
      desc: "For solo hunters testing the waters.",
      features: [
        "50 Leads / mo",
        "Basic Intent Scoring",
        "Single Strategy Hub",
        "Email Support",
      ],
      cta: "Get Started",
      popular: false,
      icon: Zap,
    },
    {
      name: "Growth Pro",
      price: "$199",
      period: "/mo",
      desc: "The standard for aggressive agencies.",
      features: [
        "500 Leads / mo",
        "Advanced Agent Intelligence",
        "Unlimited Strategy Hubs",
        "Priority Support",
        "Custom Outreach Drafts",
      ],
      cta: "Go Pro",
      popular: true,
      icon: Sparkles,
    },
    {
      name: "Scale",
      price: "$499",
      period: "/mo",
      desc: "For high-volume operations.",
      features: [
        "2,500 Leads / mo",
        "Real-time Intent Alerts",
        "API Access",
        "Dedicated Manager",
        "White-label Reports",
      ],
      cta: "Scale Now",
      popular: false,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="py-32 px-12 max-w-7xl mx-auto">
      <div className="text-center mb-32">
        <p className="text-brand-primary text-xs font-medium uppercase tracking-[0.5em] mb-8">
          Investment
        </p>
        <h2 className="text-5xl md:text-7xl font-heading font-bold text-text-main tracking-tight mb-8">
          Choose your <span className="text-gradient">velocity</span>
        </h2>
        <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed font-medium">
          Scale your agency with the power of an AI squad. No hidden fees.
          Cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-12 flex flex-col rounded-3xl ${
              plan.popular
                ? "glass-card border-brand-primary shadow-2xl shadow-brand-primary/10 z-10"
                : "glass-card border-border-soft"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-text-main text-white px-6 py-2 text-xs font-medium uppercase tracking-[0.3em] rounded-full">
                Most Popular
              </div>
            )}

            <div className="mb-12">
              <div className="w-12 h-12 border border-border-soft flex items-center justify-center mb-10 text-brand-primary rounded-xl">
                <plan.icon size={20} strokeWidth={1} />
              </div>
              <h3 className="text-3xl font-heading font-bold text-text-main mb-4">
                {plan.name}
              </h3>
              <p className="text-sm font-medium text-text-muted">{plan.desc}</p>
            </div>

            <div className="mb-16">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-heading font-bold text-text-main">
                  {plan.price}
                </span>
                <span className="text-lg font-medium text-text-muted">
                  {plan.period}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6 mb-16">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <Check
                    size={14}
                    strokeWidth={1.5}
                    className="text-brand-primary shrink-0"
                  />
                  <span className="text-sm font-medium text-text-main">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onSelect(plan.name)}
              className={`w-full py-5 text-xs font-bold uppercase tracking-[0.3em] transition-all rounded-xl ${
                plan.popular
                  ? "brand-button"
                  : "bg-bg-main text-text-main hover:bg-border-soft"
              }`}
            >
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-32 p-16 glass-card flex flex-col md:flex-row items-center justify-between gap-12 rounded-3xl">
        <div className="flex items-center gap-10">
          <div className="w-20 h-20 border border-border-soft flex items-center justify-center text-brand-primary rounded-2xl">
            <ShieldCheck size={32} strokeWidth={1} />
          </div>
          <div>
            <h4 className="text-2xl font-heading font-bold text-text-main mb-2">
              Enterprise Intelligence
            </h4>
            <p className="text-text-muted font-medium">
              Custom solutions for high-volume agencies and holding companies.
            </p>
          </div>
        </div>
        <button className="px-12 py-5 bg-bg-main text-text-main text-xs font-bold uppercase tracking-[0.3em] hover:bg-border-soft transition-all rounded-xl">
          Contact Sales
        </button>
      </div>
    </div>
  );
};
