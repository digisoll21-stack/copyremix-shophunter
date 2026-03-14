import React from "react";
import { motion } from "motion/react";
import {
  Target,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";
import { Intent } from "@shared/types.ts";

interface IntentCenterProps {
  intents: Intent[];
  onDeploy: (intent: Intent) => void;
}

export function IntentCenter({ intents, onDeploy }: IntentCenterProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-border-soft">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-heading font-bold text-text-main">
              Intent Center
            </h2>
            <p className="text-sm text-text-muted font-medium mt-1">
              Manage and deploy your strategic missions
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-secondary transition-colors shadow-sm flex items-center gap-2">
          <Plus size={16} strokeWidth={2} />
          New Intent
        </button>
      </div>

      {intents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {intents.map((intent, i) => (
            <motion.div
              key={intent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-border-soft p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-brand-primary uppercase tracking-widest bg-brand-primary/5 px-2 py-1 rounded">
                  Mission {i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 text-text-muted hover:text-brand-primary transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button className="p-1.5 text-text-muted hover:text-rose-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h4 className="text-lg font-heading font-bold text-text-main mb-3">
                {intent.title}
              </h4>
              <p className="text-sm text-text-muted leading-relaxed mb-6 flex-1">
                {intent.description}
              </p>

              <div className="flex items-center justify-between mb-6 pt-4 border-t border-border-soft">
                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                  Value
                </span>
                <span className="text-sm font-bold text-text-main">
                  {intent.potentialValue}
                </span>
              </div>

              <button
                onClick={() => onDeploy(intent)}
                className="w-full py-3 bg-bg-main hover:bg-brand-primary hover:text-white border border-border-soft hover:border-brand-primary text-text-main text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                Deploy Agents
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-bg-main rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-heading font-bold text-text-main mb-2">
            No Intents Defined
          </h3>
          <p className="text-text-muted max-w-md mx-auto mb-8">
            Create your first strategic intent to start deploying your agent
            squads.
          </p>
          <button className="px-6 py-3 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-secondary transition-colors shadow-sm flex items-center gap-2">
            <Plus size={16} strokeWidth={2} />
            Create Intent
          </button>
        </div>
      )}
    </div>
  );
}
