import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Target,
  ArrowRight,
  Briefcase,
  Sparkles,
  Loader2,
  Trash2,
  ChevronRight,
  Zap,
  Settings,
  Share2,
  Users,
  X,
} from "lucide-react";
import { BusinessProfile, Intent } from "@shared/types.ts";
import { StrategySpecialistAgent } from "@shared/agents/StrategySpecialist.ts";
import { toast } from "sonner";

interface StrategyCentreProps {
  profiles: BusinessProfile[];
  onSaveProfile: (profile: BusinessProfile) => void;
  onDeleteProfile: (id: string) => void;
  onHuntLeads: (intent: Intent) => void;
}

export function StrategyCentre({
  profiles,
  onSaveProfile,
  onDeleteProfile,
  onHuntLeads,
}: StrategyCentreProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    profiles[0]?.id || null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [newProfile, setNewProfile] = useState({
    name: "",
    website: "",
    offer: "",
    services: "",
  });

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name || !newProfile.offer) {
      toast.error("Please fill in at least the business name and offer.");
      return;
    }

    setIsAnalyzing(true);
    const agent = new StrategySpecialistAgent();

    const tempProfile: BusinessProfile = {
      id: `profile-${Date.now()}`,
      ...newProfile,
      createdAt: new Date().toISOString(),
      intents: [],
    };

    try {
      const response = await agent.process({ profile: tempProfile });
      const finalProfile = { ...tempProfile, intents: response.data };
      onSaveProfile(finalProfile);
      setSelectedProfileId(finalProfile.id);
      setIsCreating(false);
      setNewProfile({ name: "", website: "", offer: "", services: "" });
      toast.success("Strategy Hub created.");
    } catch (error) {
      console.error("Analysis failed", error);
      toast.error("Failed to analyze business.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)] bg-bg-main relative z-10">
      {/* Profiles Sidebar */}
      <aside className="w-full lg:w-80 bg-white border-r border-border-soft flex flex-col">
        <div className="p-8 border-b border-border-soft">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-6">
            Strategy Hubs
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="brand-button w-full py-3 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2"
          >
            <Plus size={14} strokeWidth={2} />
            New Strategy
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfileId(profile.id)}
              className={`w-full p-4 text-left transition-all rounded-xl border ${
                selectedProfileId === profile.id
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-transparent hover:bg-bg-main"
              }`}
            >
              <h3
                className={`text-sm tracking-tight mb-1 ${selectedProfileId === profile.id ? "font-bold text-brand-primary" : "font-medium text-text-main"}`}
              >
                {profile.name}
              </h3>
              <p className="text-xs text-text-muted uppercase tracking-widest font-semibold">
                {profile.website || "Internal Hub"}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-bg-main/50">
        {selectedProfile ? (
          <div className="max-w-5xl mx-auto p-8 lg:p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pb-8 border-b border-border-soft">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading font-bold text-text-main">
                    {selectedProfile.name}
                  </h2>
                  <p className="text-sm text-text-muted font-medium mt-1">
                    Active Strategy Hub
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-white border border-border-soft rounded-lg text-sm font-bold text-text-main hover:bg-bg-main transition-colors shadow-sm"
                >
                  Edit Hub
                </button>
                <button
                  onClick={() => onDeleteProfile(selectedProfile.id)}
                  className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
                >
                  Archive
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                {
                  label: "Strategic Intent",
                  value: selectedProfile.offer,
                  icon: Target,
                },
                {
                  label: "Target Niche",
                  value: selectedProfile.niche || "Global DTC",
                  icon: Briefcase,
                },
                { label: "Agent Status", value: "Active", icon: Users },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="bg-white border border-border-soft p-6 rounded-2xl shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                      <metric.icon size={18} strokeWidth={2} />
                    </div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                      {metric.label}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-text-main leading-relaxed">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading font-bold text-text-main">
                  Identified Missions
                </h3>
                <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-bold rounded-full">
                  {selectedProfile.intents?.length || 0} Active
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedProfile.intents?.map((intent, i) => (
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
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                        {intent.potentialValue} Value
                      </span>
                    </div>
                    <h4 className="text-lg font-heading font-bold text-text-main mb-3">
                      {intent.title}
                    </h4>
                    <p className="text-sm text-text-muted leading-relaxed mb-6 flex-1">
                      {intent.description}
                    </p>
                    <button
                      onClick={() => onHuntLeads(intent)}
                      className="w-full py-3 bg-bg-main hover:bg-brand-primary hover:text-white border border-border-soft hover:border-brand-primary text-text-main text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      Deploy Intelligence Agents
                      <ArrowRight size={16} strokeWidth={2} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 border border-border-soft flex items-center justify-center mb-12 rounded-2xl">
              <Sparkles size={32} strokeWidth={1} className="text-text-muted" />
            </div>
            <h2 className="text-3xl font-heading font-medium text-text-main mb-6">
              No Strategy Hub Selected
            </h2>
            <p className="text-text-muted font-medium mb-12 max-w-sm">
              Define your first business strategy to begin autonomous lead
              hunting.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="brand-button px-12 py-5 text-xs font-bold uppercase tracking-[0.4em] rounded-xl"
            >
              Create Hub
            </button>
          </div>
        )}
      </main>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-text-main/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-3xl overflow-hidden rounded-[32px] shadow-2xl"
            >
              <div className="p-16">
                <div className="flex items-center justify-between mb-16">
                  <h2 className="text-3xl font-heading font-medium text-text-main">
                    New Strategy Hub
                  </h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="text-text-muted hover:text-text-main"
                  >
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>

                <form onSubmit={handleCreateProfile} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <label className="text-xs font-medium text-text-muted uppercase tracking-[0.3em]">
                        Business Name
                      </label>
                      <input
                        required
                        value={newProfile.name}
                        onChange={(e) =>
                          setNewProfile((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full bg-transparent border-b border-border-soft py-4 text-lg font-medium focus:border-text-main outline-none transition-colors"
                        placeholder="e.g. Elite Growth Agency"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-medium text-text-muted uppercase tracking-[0.3em]">
                        Website
                      </label>
                      <input
                        value={newProfile.website}
                        onChange={(e) =>
                          setNewProfile((prev) => ({
                            ...prev,
                            website: e.target.value,
                          }))
                        }
                        className="w-full bg-transparent border-b border-border-soft py-4 text-lg font-medium focus:border-text-main outline-none transition-colors"
                        placeholder="e.g. elitegrowth.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-medium text-text-muted uppercase tracking-[0.3em]">
                      Core Offer
                    </label>
                    <textarea
                      required
                      value={newProfile.offer}
                      onChange={(e) =>
                        setNewProfile((prev) => ({
                          ...prev,
                          offer: e.target.value,
                        }))
                      }
                      className="w-full bg-transparent border-b border-border-soft py-4 text-lg font-medium focus:border-text-main outline-none transition-colors resize-none h-32"
                      placeholder="What is the primary value you provide?"
                    />
                  </div>

                  <div className="flex justify-end pt-12">
                    <button
                      type="submit"
                      disabled={isAnalyzing}
                      className="brand-button px-16 py-6 text-xs font-bold uppercase tracking-[0.4em] flex items-center gap-4 disabled:opacity-50 rounded-xl"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Analyzing Intent...
                        </>
                      ) : (
                        <>
                          Initialize Hub
                          <ArrowRight size={16} strokeWidth={1.5} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
