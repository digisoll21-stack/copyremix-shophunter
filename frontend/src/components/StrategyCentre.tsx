import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  X
} from 'lucide-react';
import { BusinessProfile, Intent } from '@shared/types.ts';
import { StrategySpecialistAgent } from '@shared/agents/StrategySpecialist.ts';
import { toast } from 'sonner';

interface StrategyCentreProps {
  profiles: BusinessProfile[];
  onSaveProfile: (profile: BusinessProfile) => void;
  onDeleteProfile: (id: string) => void;
  onHuntLeads: (intent: Intent) => void;
}

export function StrategyCentre({ profiles, onSaveProfile, onDeleteProfile, onHuntLeads }: StrategyCentreProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(profiles[0]?.id || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [newProfile, setNewProfile] = useState({
    name: '',
    website: '',
    offer: '',
    services: ''
  });

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

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
      intents: []
    };

    try {
      const response = await agent.process({ profile: tempProfile });
      const finalProfile = { ...tempProfile, intents: response.data };
      onSaveProfile(finalProfile);
      setSelectedProfileId(finalProfile.id);
      setIsCreating(false);
      setNewProfile({ name: '', website: '', offer: '', services: '' });
      toast.success("Strategy Hub created.");
    } catch (error) {
      console.error("Analysis failed", error);
      toast.error("Failed to analyze business.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-bg-main">
      {/* Profiles Sidebar */}
      <aside className="w-full lg:w-80 bg-bg-card border-r border-border-soft flex flex-col">
        <div className="p-8 border-b border-border-soft">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Strategy Hubs</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full py-3 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-brand-secondary transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
          >
            <Plus size={14} strokeWidth={2} />
            New Strategy
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfileId(profile.id)}
              className={`w-full p-4 text-left transition-all rounded-xl border ${
                selectedProfileId === profile.id 
                  ? 'border-brand-primary bg-brand-primary/5' 
                  : 'border-transparent hover:bg-bg-main'
              }`}
            >
              <h3 className={`text-sm tracking-tight mb-1 ${selectedProfileId === profile.id ? 'font-bold text-brand-primary' : 'font-medium text-text-main'}`}>
                {profile.name}
              </h3>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">
                {profile.website || 'Internal Hub'}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-12 lg:p-20">
        {selectedProfile ? (
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div>
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-4">Strategic Intelligence</p>
                <h2 className="text-4xl md:text-5xl font-bold text-text-main tracking-tight">{selectedProfile.name}</h2>
              </div>
              <button 
                onClick={() => onDeleteProfile(selectedProfile.id)}
                className="text-[10px] font-bold text-text-muted hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Archive Hub
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                { label: 'Strategic Intent', value: selectedProfile.offer, icon: Target },
                { label: 'Target Niche', value: selectedProfile.niche || 'Global DTC', icon: Briefcase },
                { label: 'Squad Status', value: 'Active', icon: Users }
              ].map((metric) => (
                <div key={metric.label} className="p-8 border border-border-soft bg-bg-card rounded-2xl shadow-sm">
                  <metric.icon size={20} strokeWidth={2} className="text-brand-primary mb-6" />
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{metric.label}</p>
                  <p className="text-sm font-medium text-text-main leading-relaxed">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-12">
              <h3 className="text-xl font-bold text-text-main mb-8">Identified Missions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedProfile.intents?.map((intent, i) => (
                  <motion.div
                    key={intent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 border border-border-soft bg-bg-card rounded-2xl group hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/5 transition-all"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Mission {i + 1}</span>
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{intent.potentialValue} Value</span>
                    </div>
                    <h4 className="text-xl font-bold text-text-main mb-4">{intent.title}</h4>
                    <p className="text-sm text-text-muted leading-relaxed mb-8">{intent.description}</p>
                    <button 
                      onClick={() => onHuntLeads(intent)}
                      className="w-full py-4 bg-text-main text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-brand-primary transition-all flex items-center justify-center gap-3"
                    >
                      Deploy Agent Squad
                      <ArrowRight size={14} strokeWidth={2} />
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
            <h2 className="text-3xl font-display font-light text-text-main mb-6">No Strategy Hub Selected</h2>
            <p className="text-text-muted font-light mb-12 max-w-sm">Define your first business strategy to begin autonomous lead hunting.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="px-12 py-5 bg-text-main text-white text-[10px] font-medium uppercase tracking-[0.4em] rounded-xl"
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
              className="w-full max-w-3xl bg-bg-card border border-border-soft overflow-hidden rounded-3xl shadow-xl"
            >
              <div className="p-16">
                <div className="flex items-center justify-between mb-16">
                  <h2 className="text-3xl font-display font-light text-text-main">New Strategy Hub</h2>
                  <button onClick={() => setIsCreating(false)} className="text-text-muted hover:text-text-main">
                    <X size={24} strokeWidth={1.5} />
                  </button>
                </div>

                <form onSubmit={handleCreateProfile} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-medium text-text-muted uppercase tracking-[0.3em]">Business Name</label>
                      <input 
                        required
                        value={newProfile.name}
                        onChange={e => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-transparent border-b border-border-soft py-4 text-lg font-light focus:border-text-main outline-none transition-colors"
                        placeholder="e.g. Elite Growth Agency"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-medium text-text-muted uppercase tracking-[0.3em]">Website</label>
                      <input 
                        value={newProfile.website}
                        onChange={e => setNewProfile(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full bg-transparent border-b border-border-soft py-4 text-lg font-light focus:border-text-main outline-none transition-colors"
                        placeholder="e.g. elitegrowth.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-medium text-text-muted uppercase tracking-[0.3em]">Core Offer</label>
                    <textarea 
                      required
                      value={newProfile.offer}
                      onChange={e => setNewProfile(prev => ({ ...prev, offer: e.target.value }))}
                      className="w-full bg-transparent border-b border-border-soft py-4 text-lg font-light focus:border-text-main outline-none transition-colors resize-none h-32"
                      placeholder="What is the primary value you provide?"
                    />
                  </div>

                  <div className="flex justify-end pt-12">
                    <button 
                      type="submit"
                      disabled={isAnalyzing}
                      className="px-16 py-6 bg-text-main text-white text-[10px] font-medium uppercase tracking-[0.4em] flex items-center gap-4 disabled:opacity-50 rounded-xl"
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
