import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { Logo } from './components/Logo';
import { Search, Globe, Instagram, Facebook, ExternalLink, Loader2, Sparkles, ShoppingBag, ArrowRight, DollarSign, Megaphone, Mail, ShieldCheck, Activity, Box, Download, Upload, Save, Trash2, CheckCircle2, User, Linkedin, Twitter, MessageSquare, Copy, Filter, ChevronDown, ChevronUp, MapPin, Zap, Lock, Unlock, CheckCircle, Target, Share2, TrendingUp, Users, BarChart3, AlertCircle, X, Menu } from 'lucide-react';
import { findEcomBrands, verifyLeadData, generateGhostwrittenEmail } from '@shared/services/gemini.ts';
import { revealVerifiedEmail } from '@shared/services/leadEnrichment.ts';
import { EcomStore, SearchState, BusinessProfile, Intent, ProgressUpdate } from '@shared/types.ts';
import { connectSocket } from './services/socket.ts';
import { SuccessProjection } from './components/SuccessProjection';
import { LandingPage } from './components/LandingPage';
import { StrategyCentre } from './components/StrategyCentre';
import { PricingPlan } from './components/PricingPlan';

import { LeadAnalytics } from './components/LeadAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [state, setState] = useState<SearchState>({
    query: '',
    filters: {
      revenue: '',
      region: '',
      adStatus: 'all',
      techGap: ''
    },
    results: [],
    isSearching: false,
    error: null,
    forceFresh: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [savedLeads, setSavedLeads] = useState<EcomStore[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'pipeline' | 'strategy' | 'pricing' | 'analytics'>('strategy');
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [ghostwrittenEmail, setGhostwrittenEmail] = useState<string | null>(null);

  // Initial data fetch
  React.useEffect(() => {
    const userId = 'demo-user-123';
    const socket = connectSocket(userId);

    socket.on("lead:found", ({ jobId, lead }: { jobId: string, lead: EcomStore }) => {
      setState(prev => {
        if (prev.results.find(l => l.url === lead.url)) return prev;
        return {
          ...prev,
          results: [lead, ...prev.results]
        };
      });
      toast.success(`New lead found: ${lead.name}`, {
        description: lead.niche,
        duration: 2000
      });
    });

    socket.on("job:progress", ({ jobId, progress, detail }: { jobId: string, progress: string, detail: ProgressUpdate }) => {
      setJobProgress(progress);
      setJobProgressDetail(detail);
    });

    socket.on("job:status", ({ jobId, status, progress, count, detail }: { jobId: string, status: string, progress: string, count?: number, detail?: ProgressUpdate }) => {
      setJobProgress(progress);
      if (detail) setJobProgressDetail(detail);
      
      if (status === 'completed') {
        setState(prev => ({ ...prev, isSearching: false }));
        setActiveJobId(null);
        setJobProgress(null);
        setJobProgressDetail(null);
        toast.success(`Hunt completed! Found ${count} leads.`);
      } else if (status === 'failed') {
        setState(prev => ({ ...prev, isSearching: false, error: progress }));
        setActiveJobId(null);
        setJobProgress(null);
        setJobProgressDetail(null);
        toast.error(`Hunt failed: ${progress}`);
      }
    });

    const fetchData = async () => {
      try {
        const headers = { 'x-user-id': 'demo-user-123' };
        const [leadsRes, profilesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL || ''}/api/profiles`, { headers })
        ]);
        
        if (leadsRes.ok) {
          const leads = await leadsRes.json();
          setSavedLeads(leads);
        }
        
        if (profilesRes.ok) {
          const profiles = await profilesRes.json();
          setBusinessProfiles(profiles);
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
        toast.error("Failed to sync with database. Using local state.");
      }
    };
    fetchData();
  }, []);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedLeadForTemplate, setSelectedLeadForTemplate] = useState<EcomStore | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ url: string, notes: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [verifyingUrls, setVerifyingUrls] = useState<Set<string>>(new Set());
  const [verifyingEmails, setVerifyingEmails] = useState<Set<string>>(new Set());
  const [revealingUrls, setRevealingUrls] = useState<Set<string>>(new Set());
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'lead' | 'profile', id: string, name: string } | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<string | null>(null);
  const [jobProgressDetail, setJobProgressDetail] = useState<ProgressUpdate | null>(null);

  const generateTemplate = (store: EcomStore) => {
    const name = store.founderInfo?.name?.split(' ')[0] || 'there';
    const niche = store.niche || 'your store';
    const apps = store.apps?.slice(0, 2).join(' and ') || store.platform;
    const email = store.isEmailRevealed ? store.revealedEmail : (store.founderInfo?.personalEmail || store.contactEmail || '[Email]');
    
    return `To: ${email}
Subject: Quick question about ${store.name}

Hi ${name},

I was just checking out ${store.name} and noticed you're doing some great things in the ${niche} space. 

I saw you're using ${apps}—I've actually helped brands similar to yours scale their revenue by optimizing those exact systems. 

Would you be open to a 10-minute chat about how we can help ${store.name} hit its next revenue milestone?

Best,
[Your Name]`;
  };

  const handleGenerateEmail = async (lead: EcomStore) => {
    if (businessProfiles.length === 0) {
      toast.error("Please create a business profile in the Strategy Centre first.");
      setActiveTab('strategy');
      return;
    }

    setIsGeneratingEmail(true);
    setGhostwrittenEmail(null);
    setSelectedLeadForTemplate(lead);
    setActiveAgent("Ghostwriter");

    try {
      const email = await generateGhostwrittenEmail(lead, businessProfiles[0]);
      setGhostwrittenEmail(email);
    } catch (err) {
      console.error("Failed to generate email", err);
      toast.error("Failed to generate personalized email.");
    } finally {
      setIsGeneratingEmail(false);
      setActiveAgent(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const saveLeads = async (leads: EcomStore[]) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify(leads)
      });
      
      if (response.ok) {
        setSavedLeads(prev => {
          const newLeads = [...prev];
          leads.forEach(lead => {
            if (!newLeads.find(l => l.url === lead.url)) {
              newLeads.push({ ...lead, status: 'New' });
            }
          });
          return newLeads;
        });
        toast.success(`Saved ${leads.length} leads to database`);
      }
    } catch (err) {
      console.error("Failed to save leads", err);
      toast.error("Failed to save leads to database");
    }
  };

  const updateLeadStatus = async (url: string, status: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads/${encodeURIComponent(url)}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setSavedLeads(prev => prev.map(l => l.url === url ? { ...l, status } : l));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const updateLeadNotes = async (url: string, notes: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads/${encodeURIComponent(url)}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        setSavedLeads(prev => prev.map(l => l.url === url ? { ...l, notes } : l));
      }
    } catch (err) {
      console.error("Failed to update notes", err);
    }
    setEditingNotes(null);
  };

  const removeLead = async (url: string) => {
    const lead = savedLeads.find(l => l.url === url);
    if (!lead) return;
    setDeleteConfirmation({ type: 'lead', id: url, name: lead.name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const { type, id } = deleteConfirmation;

    try {
      if (type === 'lead') {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'x-user-id': 'demo-user-123' }
        });
        
        if (response.ok) {
          setSavedLeads(prev => prev.filter(l => l.url !== id));
          toast.success("Lead removed successfully");
        }
      } else if (type === 'profile') {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/profiles/${id}`, {
          method: 'DELETE',
          headers: { 'x-user-id': 'demo-user-123' }
        });
        
        if (response.ok) {
          setBusinessProfiles(prev => prev.filter(p => p.id !== id));
          toast.success("Business Hub deleted successfully");
        }
      }
    } catch (err) {
      console.error(`Failed to delete ${type}`, err);
      toast.error(`Failed to delete ${type}. Please try again.`);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const exportToCSV = (leads: EcomStore[]) => {
    const headers = ['Name', 'URL', 'Platform', 'Niche', 'Revenue', 'Ads Live', 'Ad Spend', 'Scaling Status', 'AOV', 'Creative Style', 'Retargeting', 'Ad Themes', 'Marketing Hook', 'Primary Platform', 'SEO Keywords', 'SEO Gaps', 'Organic Opportunity', 'SEO Strategy', 'Email', 'Apps', 'Founder Name', 'Founder Title', 'Founder LinkedIn', 'Founder Twitter', 'Founder Instagram', 'Founder Facebook', 'Founder Email', 'Instagram', 'Facebook'];
    const rows = leads.map(l => [
      l.name,
      l.url,
      l.platform,
      l.niche,
      l.estimatedRevenue || 'N/A',
      l.isRunningAds ? 'Yes' : 'No',
      l.adInsights?.estimatedSpend || 'N/A',
      l.adInsights?.scalingStatus || 'Stable',
      l.adInsights?.estimatedAOV || 'N/A',
      l.adInsights?.creativeStyle || 'N/A',
      l.adInsights?.retargetingEnabled ? 'Yes' : 'No',
      l.adInsights?.adCopyThemes?.join('; ') || 'N/A',
      l.adInsights?.marketingHook || 'N/A',
      l.adInsights?.primaryAdPlatform || 'N/A',
      l.seoInsights?.topKeywords?.join('; ') || 'N/A',
      l.seoInsights?.seoGaps?.join('; ') || 'N/A',
      l.seoInsights?.organicOpportunity || 'N/A',
      l.seoInsights?.seoStrategy || 'N/A',
      l.contactEmail || 'N/A',
      l.apps?.join('; ') || 'N/A',
      l.founderInfo?.name || 'N/A',
      l.founderInfo?.title || 'N/A',
      l.founderInfo?.linkedin || 'N/A',
      l.founderInfo?.twitter || 'N/A',
      l.founderInfo?.instagram || 'N/A',
      l.founderInfo?.facebook || 'N/A',
      l.founderInfo?.personalEmail || 'N/A',
      l.socialLinks?.instagram || '',
      l.socialLinks?.facebook || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ecom_leads_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const urls = text.split('\n').map(line => line.trim()).filter(line => line.startsWith('http'));
      
      if (urls.length > 0) {
        setState(prev => ({ ...prev, isSearching: true, error: null }));
        try {
          // Process in batches or just use the first few for demo
          const query = `Analyze these specific stores: ${urls.slice(0, 5).join(', ')}`;
          const stores = await findEcomBrands(query, state.filters);
          setState(prev => ({ ...prev, results: stores, isSearching: false }));
          setActiveTab('search');
        } catch (err) {
          setState(prev => ({ ...prev, isSearching: false, error: 'Failed to analyze imported URLs' }));
        }
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string, overrideMission?: Intent) => {
    if (e) e.preventDefault();
    const queryToUse = overrideQuery || state.query;
    if (!queryToUse.trim()) return;

    setState(prev => ({ 
      ...prev, 
      query: queryToUse, 
      isSearching: true, 
      results: [], // Clear results for new search
      error: null,
      activeMission: overrideMission || (overrideQuery ? prev.activeMission : undefined)
    }));
    setActiveAgent("Brand Scout");
    setJobProgress("Initializing Hunt...");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads/hunt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({
          query: queryToUse,
          filters: state.filters,
          mission: overrideMission || (overrideQuery ? state.activeMission : undefined)
        })
      });

      if (!response.ok) throw new Error("Failed to start background hunt");
      
      const { jobId } = await response.json();
      setActiveJobId(jobId);
      toast.info("Hunt started in background. You can leave this page and results will continue to sync.");
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isSearching: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred' 
      }));
      setActiveAgent(null);
      setJobProgress(null);
    }
  };

  const handleSaveBusinessProfile = async (profile: BusinessProfile) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/profiles`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        setBusinessProfiles(prev => {
          const existingIdx = prev.findIndex(p => p.id === profile.id);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = profile;
            return updated;
          }
          return [...prev, profile];
        });
        toast.success("Business profile saved");
      }
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  const handleDeleteBusinessProfile = (id: string) => {
    const profile = businessProfiles.find(p => p.id === id);
    if (!profile) return;
    setDeleteConfirmation({ type: 'profile', id, name: profile.name });
  };

  const handleHuntLeads = (intent: Intent) => {
    setActiveTab('search');
    handleSearch(undefined, intent.searchQuery, intent);
  };

  const handleVerifyLead = async (lead: EcomStore) => {
    setVerifyingUrls(prev => new Set(prev).add(lead.url));
    setActiveAgent("Agent Squad");
    try {
      // Find the active business profile to pass to the Deal Closer
      const activeProfile = businessProfiles[0]; // For now, use the first one if it exists
      const verified = await verifyLeadData(lead, activeProfile);
      
      // Update in search results
      setState(prev => ({
        ...prev,
        results: prev.results.map(l => l.url === lead.url ? verified : l)
      }));

      // Update in saved leads
      const isSaved = savedLeads.find(l => l.url === lead.url);
      if (isSaved) {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads/${encodeURIComponent(lead.url)}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user-123'
          },
          body: JSON.stringify({ data: verified })
        });
        setSavedLeads(prev => prev.map(l => l.url === lead.url ? verified : l));
      }
      toast.success("Intelligence Squad: Data Verified & Enriched");
    } catch (err) {
      console.error("Verification failed", err);
      toast.error("Squad enrichment failed. Please try again.");
    } finally {
      setVerifyingUrls(prev => {
        const next = new Set(prev);
        next.delete(lead.url);
        return next;
      });
      setActiveAgent(null);
    }
  };

  const handleRevealEmail = async (lead: EcomStore) => {
    setRevealingUrls(prev => new Set(prev).add(lead.url));
    setActiveAgent("Verification Guard");
    try {
      const { email, source } = await revealVerifiedEmail(lead);
      
      const updatedLead = {
        ...lead,
        isEmailRevealed: true,
        revealedEmail: email,
        dataSources: [...(lead.dataSources || []), source].filter((v, i, a) => a.indexOf(v) === i)
      };

      // Update in search results
      setState(prev => ({
        ...prev,
        results: prev.results.map(l => l.url === lead.url ? updatedLead : l)
      }));

      // Update in saved leads
      const isSaved = savedLeads.find(l => l.url === lead.url);
      if (isSaved) {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads/${encodeURIComponent(lead.url)}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': 'demo-user-123'
          },
          body: JSON.stringify({ data: updatedLead })
        });
        setSavedLeads(prev => prev.map(l => l.url === lead.url ? updatedLead : l));
      }

      toast.success(`Email revealed: ${email}`);
    } catch (err) {
      console.error("Email reveal failed", err);
      toast.error(err instanceof Error ? err.message : "Failed to reveal email. Please try again.");
    } finally {
      setRevealingUrls(prev => {
        const next = new Set(prev);
        next.delete(lead.url);
        return next;
      });
      setActiveAgent(null);
    }
  };

  const handleVerifyEmail = async (lead: EcomStore) => {
    const email = lead.revealedEmail || lead.founderInfo?.personalEmail || lead.contactEmail;
    if (!email) {
      toast.error("No email address found to verify.");
      return;
    }

    setVerifyingEmails(prev => new Set(prev).add(lead.url));
    setActiveAgent("Verification Guard");
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/leads/verify-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ url: lead.url, email })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const updatedLead = result.lead;
        
        // Update in search results
        setState(prev => ({
          ...prev,
          results: prev.results.map(l => l.url === lead.url ? updatedLead : l)
        }));

        // Update in saved leads
        setSavedLeads(prev => prev.map(l => l.url === lead.url ? updatedLead : l));
        
        toast.success(`Email verified successfully: ${email}`);
      } else {
        toast.error(result.message || "Email verification failed.");
      }
    } catch (err) {
      console.error("Email verification failed", err);
      toast.error("Failed to connect to verification service.");
    } finally {
      setVerifyingEmails(prev => {
        const next = new Set(prev);
        next.delete(lead.url);
        return next;
      });
      setActiveAgent(null);
    }
  };

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-main selection:bg-brand-primary/20">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-bg-card border-r border-border-soft h-screen sticky top-0 z-50">
        <div className="p-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Target className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-text-main tracking-tight">ShopHunter</h1>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">Intelligence OS</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between px-6 pb-10">
          <nav className="space-y-2">
            {[
              { id: 'strategy', label: 'Strategy Hub', icon: Sparkles },
              { id: 'search', label: 'Active Missions', icon: Target },
              { id: 'pipeline', label: 'Growth Pipeline', icon: Activity },
              { id: 'saved', label: 'Brand CRM', icon: Users, badge: savedLeads.length },
              { id: 'analytics', label: 'Intelligence', icon: BarChart3 },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-text-main text-white shadow-xl shadow-text-main/10' 
                    : 'text-text-muted hover:text-text-main hover:bg-bg-main'
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-text-muted'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-bg-main text-text-muted'}`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}

            <div className="pt-10 px-5">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-6">Management</p>
              <button 
                onClick={() => setActiveTab('pricing')}
                className={`w-full flex items-center gap-4 px-0 py-2 text-sm transition-all ${
                  activeTab === 'pricing' 
                    ? 'text-brand-primary' 
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="font-medium">Billing & Usage</span>
              </button>
            </div>
          </nav>

          <div className="space-y-6">
            <label className="cursor-pointer flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-medium text-text-muted hover:text-text-main hover:bg-bg-main transition-all group">
              <Upload className="w-4 h-4 opacity-50 group-hover:opacity-100" />
              <span>Import Dataset</span>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSVImport} />
            </label>
            
            <div className="p-6 bg-bg-main rounded-3xl border border-border-soft">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Usage</p>
                <p className="text-[10px] font-bold text-brand-primary">12%</p>
              </div>
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-4">
                <div className="h-full bg-brand-primary w-[12%]" />
              </div>
              <button 
                onClick={() => setActiveTab('pricing')}
                className="brand-button w-full py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-bg-card/70 backdrop-blur-xl border-b border-border-soft sticky top-0 z-[100] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Target className="text-white w-4 h-4" />
          </div>
          <span className="text-xl font-heading font-bold text-text-main tracking-tight">ShopHunter</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-text-main transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full bg-bg-card/95 backdrop-blur-xl border-b border-border-soft shadow-2xl p-8 z-[110]"
            >
              <div className="flex flex-col gap-4">
                {[
                  { id: 'strategy', label: 'Strategy Hub', icon: Sparkles },
                  { id: 'search', label: 'Active Missions', icon: Target },
                  { id: 'pipeline', label: 'Growth Pipeline', icon: Activity },
                  { id: 'saved', label: 'Brand CRM', icon: Users, badge: savedLeads.length },
                  { id: 'analytics', label: 'Intelligence', icon: BarChart3 },
                  { id: 'pricing', label: 'Plans & Billing', icon: ShieldCheck },
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                    className={`flex items-center justify-between p-4 rounded-2xl text-sm transition-all ${
                      activeTab === item.id ? 'bg-text-main text-white shadow-lg shadow-text-main/10' : 'text-text-muted hover:bg-bg-main'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon size={16} strokeWidth={1.5} />
                      <span className={activeTab === item.id ? 'font-medium' : 'font-light'}>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-bg-main text-text-muted'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-[1800px] mx-auto w-full px-6 py-12 md:px-12 md:py-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'strategy' && (
                  <StrategyCentre 
                    profiles={businessProfiles}
                    onSaveProfile={handleSaveBusinessProfile}
                    onDeleteProfile={handleDeleteBusinessProfile}
                    onHuntLeads={handleHuntLeads}
                  />
                )}

                {activeTab === 'analytics' && (
                  <LeadAnalytics />
                )}

                {activeTab === 'pricing' && (
                  <PricingPlan onSelect={(plan) => toast.success(`Selected ${plan} plan!`)} />
                )}

                {/* Hero Section */}
                {activeTab === 'search' && (
                  <div className="space-y-32">
                    <div className="text-center">
                      {!state.activeMission && state.results.length === 0 && (
                        <div className="py-32">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="inline-flex items-center gap-4 text-brand-primary text-[10px] font-bold uppercase tracking-[0.5em] mb-12"
                          >
                            Intelligence-First DTC Prospecting
                          </motion.div>
                          <h2 className="text-6xl md:text-8xl font-heading font-bold mb-12 leading-[1.05] tracking-tight text-text-main">
                            Deploy your <br />
                            <span className="text-gradient">Agent Squad</span>
                          </h2>
                          <p className="text-lg md:text-2xl text-text-muted max-w-3xl mx-auto mb-20 leading-relaxed font-light">
                            Manual searching is a relic. Define your intent in the <span className="text-text-main font-medium">Strategy Hub</span> and let our AI hunt for brands that align with your vision.
                          </p>
                          <div className="flex justify-center">
                            <button 
                              onClick={() => setActiveTab('strategy')}
                              className="group flex flex-col items-center gap-6"
                            >
                              <div className="w-px h-24 bg-border-soft relative overflow-hidden">
                                <motion.div 
                                  animate={{ y: [0, 96] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  className="absolute top-0 left-0 w-full h-1/2 bg-brand-primary"
                                />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted group-hover:text-brand-primary transition-colors">Enter Strategy Hub</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {state.activeMission && (
                      <div className="max-w-5xl mx-auto">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card p-16 rounded-[40px] relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-16">
                              <div className="flex items-center gap-6">
                                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em]">Active Mission</span>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">
                                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                                  Squad Deployed
                                </div>
                              </div>
                              <button 
                                onClick={() => setState(prev => ({ ...prev, activeMission: undefined, results: [] }))}
                                className="text-[10px] font-bold text-text-muted hover:text-brand-primary uppercase tracking-[0.3em] transition-colors"
                              >
                                Terminate
                              </button>
                            </div>
                            <h2 className="text-5xl font-heading font-bold text-text-main mb-8 tracking-tight">{state.activeMission.title}</h2>
                            <p className="text-xl text-text-muted mb-16 max-w-2xl leading-relaxed font-light">{state.activeMission.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-12 border-t border-border-soft">
                              <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Intent Score</p>
                                <p className="text-4xl font-heading font-bold text-brand-primary">98.4%</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Brands Found</p>
                                <p className="text-4xl font-heading font-bold text-text-main">{state.results.length}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Velocity</p>
                                <p className="text-4xl font-heading font-bold text-text-main">Optimal</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Status</p>
                                <p className="text-4xl font-heading font-bold text-text-main">Active</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {activeTab === 'search' && (
              <div className="mb-16">
                <SuccessProjection />
              </div>
            )}

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {((activeTab === 'search' && state.results.length > 0) || 
            (activeTab === 'saved' && savedLeads.length > 0) || 
            (activeTab === 'pipeline' && savedLeads.length > 0)) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 p-8 glass-card rounded-3xl"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <BarChart3 size={20} strokeWidth={1.5} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                  {activeTab === 'search' ? 'Squad Findings' : activeTab === 'saved' ? 'Intelligence CRM' : 'Strategic Flow'} ({activeTab === 'search' ? state.results.length : savedLeads.length} leads)
                </span>
              </div>
              <div className="flex items-center gap-6">
                {activeTab === 'search' && (
                  <button 
                    onClick={() => saveLeads(state.results)}
                    className="text-[10px] font-bold text-text-muted hover:text-brand-primary uppercase tracking-[0.3em] transition-colors"
                  >
                    Archive All
                  </button>
                )}
                <button 
                  onClick={() => exportToCSV(activeTab === 'search' ? state.results : savedLeads)}
                  className="brand-button px-8 py-4 text-[10px] font-bold uppercase tracking-[0.3em] rounded-xl"
                >
                  Export Intelligence
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        {(activeTab === 'search' || activeTab === 'saved' || activeTab === 'pipeline') && (
          <div className="space-y-8">
            {state.isSearching && activeTab === 'search' && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 rounded-3xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                      <Loader2 className="text-brand-primary w-6 h-6 animate-spin" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.3em] mb-1">Squad Deployment Active</p>
                      <h3 className="text-xl font-heading font-bold text-text-main tracking-tight">
                        {jobProgressDetail?.step || 'Synchronizing Intelligence...'}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Progress</p>
                      <p className="text-3xl font-heading font-bold text-text-main">{jobProgressDetail?.percentage || 0}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Leads Found</p>
                      <p className="text-3xl font-heading font-bold text-text-main">{state.results.length}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="w-full h-2 bg-bg-main rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${jobProgressDetail?.percentage || 0}%` }}
                      className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500 ease-out"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] text-text-muted font-medium italic">
                      {jobProgressDetail?.details || 'Initializing agents...'}
                    </p>
                    {jobProgressDetail?.agentName && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_10px_rgba(255,92,0,0.5)]" />
                        <p className="text-[10px] font-bold text-text-main uppercase tracking-widest">
                          Active: {jobProgressDetail.agentName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
            {state.error ? (
              <motion.div 
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 text-red-600 p-6 rounded-2xl text-center max-w-lg mx-auto border border-red-100"
              >
                <p className="font-medium">{state.error}</p>
                <button 
                  onClick={() => setState(prev => ({ ...prev, error: null }))}
                  className="mt-4 text-sm font-bold underline hover:text-red-700 transition-colors"
                >
                  Try again
                </button>
              </motion.div>
            ) : (activeTab === 'pipeline' && savedLeads.length > 0) ? (
            <div className="space-y-16">
              <div>
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.4em] mb-6">Strategic Flow</p>
                <h2 className="text-5xl font-heading font-bold text-text-main tracking-tight">Sales Pipeline</h2>
              </div>
              <motion.div 
                key="pipeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex overflow-x-auto pb-12 gap-8 snap-x"
              >
              {(['New', 'Contacted', 'Follow-up', 'Qualified', 'Closed', 'Lost'] as const).map(status => (
                <div key={status} className="flex flex-col gap-8 min-w-[320px] snap-start">
                  <div className="flex items-center justify-between border-b border-border-soft pb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">{status}</h3>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                      {savedLeads.filter(l => l.status === status).length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-6 min-h-[500px]">
                    {savedLeads.filter(l => l.status === status).map(lead => (
                      <motion.div
                        key={lead.url}
                        id={`lead-card-${lead.url.replace(/[^a-zA-Z0-9]/g, '-')}`}
                        layoutId={lead.url}
                        className="glass-card p-8 rounded-3xl hover:border-brand-primary/30 transition-all cursor-pointer group"
                        onClick={() => handleGenerateEmail(lead)}
                      >
                        <h4 className="text-xl font-heading font-bold text-text-main mb-2 truncate">{lead.name}</h4>
                        <p className="text-[10px] text-text-muted uppercase tracking-[0.1em] font-bold truncate mb-8">{lead.niche}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{lead.estimatedRevenue || 'N/A'}</span>
                          <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateEmail(lead);
                              }}
                              className="text-text-muted hover:text-text-main"
                            >
                              <MessageSquare size={14} strokeWidth={1.5} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLead(lead.url);
                              }}
                              className="text-text-muted hover:text-red-500"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
          ) : (activeTab === 'search' ? state.results : savedLeads).length > 0 ? (
            <div className="space-y-8">
              {activeTab === 'saved' && (
                <div>
                  <h2 className="text-3xl font-heading font-bold text-text-main tracking-tight">Leads CRM</h2>
                  <p className="text-text-muted mt-2">Manage your saved prospects and update their CRM status.</p>
                </div>
              )}
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
              {(activeTab === 'search' ? state.results : savedLeads).map((store, index) => (
                <motion.div
                  key={store.url}
                  id={`lead-card-${store.url.replace(/[^a-zA-Z0-9]/g, '-')}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-8 rounded-[32px] hover:border-brand-primary/30 transition-all group flex flex-col h-full relative"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-12 bg-bg-main rounded-xl border border-border-soft flex items-center justify-center group-hover:border-brand-primary group-hover:bg-brand-primary/5 transition-all">
                      <Globe size={20} strokeWidth={1.5} className="text-text-muted group-hover:text-brand-primary transition-colors" />
                    </div>
                    <div className="flex flex-col items-end gap-4">
                      <div className="flex gap-4">
                        {activeTab !== 'search' && (
                          <select 
                            value={store.status || 'New'}
                            onChange={(e) => updateLeadStatus(store.url, e.target.value as any)}
                            className="text-[10px] font-bold bg-transparent text-brand-primary border-b border-brand-primary/30 outline-none cursor-pointer uppercase tracking-widest"
                          >
                            <option value="New">NEW</option>
                            <option value="Contacted">CONTACTED</option>
                            <option value="Follow-up">FOLLOW-UP</option>
                            <option value="Qualified">QUALIFIED</option>
                            <option value="Closed">CLOSED</option>
                            <option value="Lost">LOST</option>
                          </select>
                        )}
                        {store.isRunningAds && (
                          <div className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,92,0,0.5)]" />
                            Ads Live
                          </div>
                        )}
                        <a 
                          href={store.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-brand-primary transition-colors"
                        >
                          <ExternalLink size={18} strokeWidth={1.5} />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-heading font-bold text-text-main mb-3 group-hover:text-brand-primary transition-colors truncate">
                      {store.name}
                    </h3>
                    <p className="text-sm text-text-muted mb-8 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>
                    
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-bg-main rounded-2xl border border-border-soft">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Estimated Revenue</p>
                      <p className="text-lg font-heading font-bold text-text-main">{store.estimatedRevenue || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/20">
                      <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">Intent Score</p>
                      <p className="text-lg font-heading font-bold text-brand-primary">
                        {store.intentScore ? `${store.intentScore}%` : 'High'}
                      </p>
                    </div>
                    <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                      <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-1">Ad Insights</p>
                      <p className="text-lg font-heading font-bold text-brand-secondary">
                        {store.isRunningAds ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  </div>
                  
                  <div className="space-y-8 mb-10">
                    {store.intentSignals && store.intentSignals.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Key Signals</p>
                        <div className="flex flex-wrap gap-3">
                          {store.intentSignals.slice(0, 2).map((signal, i) => (
                            <span key={i} className="text-[10px] text-text-main font-medium bg-bg-main border border-border-soft px-3 py-1.5 rounded-lg">
                              {signal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {store.strategicFit && (
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Strategic Fit</p>
                        <p className="text-sm text-text-main leading-relaxed italic">
                          "{store.strategicFit}"
                        </p>
                      </div>
                    )}
                  </div>
                  

                  <div className="space-y-6 flex-1">

                    {activeTab !== 'search' && (
                      <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">CRM Intelligence</p>
                          <button 
                            onClick={() => setEditingNotes({ url: store.url, notes: store.notes || '' })}
                            className="text-[10px] text-brand-primary font-bold hover:underline tracking-widest"
                          >
                            EDIT
                          </button>
                        </div>
                        <div className="p-6 bg-bg-main rounded-2xl border border-border-soft min-h-[80px]">
                          {editingNotes?.url === store.url ? (
                            <div className="space-y-4">
                              <textarea 
                                value={editingNotes.notes}
                                onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
                                className="w-full bg-transparent text-sm text-text-main outline-none resize-none font-medium"
                                rows={3}
                                placeholder="Enter intelligence notes..."
                                autoFocus
                              />
                              <div className="flex justify-end gap-6">
                                <button onClick={() => setEditingNotes(null)} className="text-[10px] text-text-muted font-bold uppercase tracking-widest hover:text-text-main transition-colors">Cancel</button>
                                <button 
                                  onClick={() => {
                                    updateLeadNotes(store.url, editingNotes.notes);
                                    setEditingNotes(null);
                                  }} 
                                  className="text-[10px] text-brand-primary font-bold uppercase tracking-widest hover:underline"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-text-muted font-medium italic leading-relaxed">
                              {store.notes || 'No intelligence recorded yet.'}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {store.adInsights && (
                      <div className="mb-10 space-y-6">
                        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em]">Ad Intelligence</p>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] text-text-muted uppercase tracking-[0.1em] mb-1 font-bold">Est. Spend</p>
                            <p className="text-sm font-heading font-bold text-text-main">{store.adInsights.estimatedSpend || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-text-muted uppercase tracking-[0.1em] mb-1 font-bold">Scaling</p>
                            <p className="text-sm font-heading font-bold text-text-main">{store.adInsights.scalingStatus || 'Stable'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Founder Info Section */}
                  {(store.founderInfo || store.contactEmail) && (
                    <div className="mb-8 p-6 bg-bg-main rounded-[24px] border border-border-soft">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <User size={16} strokeWidth={1.5} className="text-brand-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Decision Maker</span>
                        </div>
                        {store.isEmailRevealed && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                            <CheckCircle className="w-4 h-4" /> Verified
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-bg-card rounded-full border-2 border-bg-card shadow-sm overflow-hidden">
                              <img src={`https://picsum.photos/seed/${store.founderInfo?.name || store.name}/100/100`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-0.5">
                              {store.founderInfo?.name && (
                                <p className="text-sm font-heading font-bold text-text-main">{store.founderInfo.name}</p>
                              )}
                              {store.founderInfo?.title && (
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{store.founderInfo.title}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {store.founderInfo?.linkedin && (
                              <a href={store.founderInfo.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-bg-card border border-border-soft rounded-xl hover:text-brand-primary transition-all hover:scale-110 shadow-sm">
                                <Linkedin className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Email Reveal Section */}
                        <div className="pt-4 border-t border-border-soft">
                          {store.isEmailRevealed ? (
                            <div className="flex items-center justify-between bg-bg-card p-3 rounded-xl border border-brand-primary/20 shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <Mail className="w-4 h-4 text-brand-primary shrink-0" />
                                <span className="text-xs font-bold text-text-main truncate">{store.revealedEmail}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => copyToClipboard(store.revealedEmail!)}
                                  className="p-1.5 text-text-muted hover:text-brand-primary transition-colors"
                                  title="Copy Email"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                {store.verificationStatus !== 'Verified' && (
                                  <button 
                                    onClick={() => handleVerifyEmail(store)}
                                    disabled={verifyingEmails.has(store.url)}
                                    className="p-1.5 text-brand-primary hover:text-brand-secondary transition-colors"
                                    title="Verify Deliverability"
                                  >
                                    {verifyingEmails.has(store.url) ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {(store.contactEmail || store.founderInfo?.personalEmail) && (
                                <div className="flex items-center justify-between bg-bg-card p-3 rounded-xl border border-border-soft shadow-sm">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <Mail className="w-4 h-4 text-text-muted shrink-0" />
                                    <span className="text-xs font-medium text-text-muted truncate">
                                      {store.founderInfo?.personalEmail || store.contactEmail}
                                    </span>
                                  </div>
                                  {store.verificationStatus !== 'Verified' && (
                                    <button 
                                      onClick={() => handleVerifyEmail(store)}
                                      disabled={verifyingEmails.has(store.url)}
                                      className="p-1.5 text-brand-primary hover:text-brand-secondary transition-colors"
                                      title="Verify Deliverability"
                                    >
                                      {verifyingEmails.has(store.url) ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <ShieldCheck className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                              <button 
                                onClick={() => handleRevealEmail(store)}
                                disabled={revealingUrls.has(store.url)}
                                className="brand-button w-full py-4 text-sm disabled:opacity-50"
                              >
                                {revealingUrls.has(store.url) ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Revealing...
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-4 h-4" />
                                    Reveal Verified Email
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          {store.founderInfo?.twitter && (
                            <a href={store.founderInfo.twitter} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-brand-primary transition-colors">
                              <Twitter className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {store.founderInfo?.instagram && (
                            <a href={store.founderInfo.instagram} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-brand-primary transition-colors">
                              <Instagram className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {store.founderInfo?.facebook && (
                            <a href={store.founderInfo.facebook} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-brand-primary transition-colors">
                              <Facebook className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {store.founderInfo?.personalEmail && !store.isEmailRevealed && (
                            <div className="flex items-center gap-1 text-[10px] text-text-muted">
                              <Mail className="w-3 h-3" />
                              <span>Public Email Found</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-bg-card border border-border-soft rounded-full text-[10px] uppercase tracking-wider font-bold text-text-muted shadow-sm">
                      {store.niche}
                    </span>
                  </div>

                  {/* Data Intelligence Section */}
                  <div className="mb-10 p-6 bg-bg-main rounded-[24px] border border-border-soft">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} strokeWidth={1.5} className={store.confidenceScore && store.confidenceScore > 80 ? 'text-brand-primary' : 'text-brand-primary'} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Data Intelligence</span>
                      </div>
                      {store.confidenceScore && (
                        <span className={`text-[10px] font-bold tracking-widest ${
                          store.confidenceScore > 85 ? 'text-brand-primary' : 
                          store.confidenceScore > 60 ? 'text-amber-600' : 
                          'text-rose-600'
                        }`}>
                          {store.confidenceScore}% Confidence
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-muted font-bold">Verification Status:</span>
                        <span className={`font-bold uppercase tracking-widest ${store.verificationStatus === 'Squad-Verified' || store.verificationStatus === 'Verified' ? 'text-brand-primary' : 'text-text-muted'}`}>
                          {store.verificationStatus || 'Unverified'}
                        </span>
                      </div>
                      {store.lastVerifiedAt && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-muted font-bold">Last Intelligence Sync:</span>
                          <span className="text-text-main font-bold">
                            {new Date(store.lastVerifiedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {store.scoreBreakdown && (
                        <div className="pt-4 mt-4 border-t border-border-soft">
                          <p className="text-[10px] text-text-muted uppercase font-bold mb-3 tracking-widest">Intelligence Score Breakdown</p>
                          <div className="h-24 w-full mb-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: 'Email', value: store.scoreBreakdown.hasEmail ? 100 : 20 },
                                { name: 'Ads', value: store.scoreBreakdown.hasAds ? 100 : 20 },
                                { name: 'Founder', value: store.scoreBreakdown.hasFounder ? 100 : 20 },
                                { name: 'Growth', value: store.scoreBreakdown.hasGrowthSignals ? 100 : 20 },
                                { name: 'Tech', value: store.scoreBreakdown.hasTechGaps ? 100 : 20 },
                                { name: 'Traffic', value: store.scoreBreakdown.hasHighTraffic ? 100 : 20 },
                                { name: 'Social', value: store.scoreBreakdown.hasSocialPresence ? 100 : 20 },
                                { name: 'Authority', value: store.scoreBreakdown.hasStrongFounder ? 100 : 20 },
                                { name: 'Verify', value: store.scoreBreakdown.isVerifiable ? 100 : 20 },
                              ]}>
                                <XAxis dataKey="name" hide />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip 
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      return (
                                        <div className="bg-bg-card px-2 py-1 border border-border-soft rounded shadow-sm text-[10px] font-bold text-text-main">
                                          {payload[0].payload.name}: {payload[0].value === 100 ? 'Verified' : 'Missing'}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                  {
                                    [
                                      { name: 'Email', value: store.scoreBreakdown.hasEmail ? 100 : 20 },
                                      { name: 'Ads', value: store.scoreBreakdown.hasAds ? 100 : 20 },
                                      { name: 'Founder', value: store.scoreBreakdown.hasFounder ? 100 : 20 },
                                      { name: 'Growth', value: store.scoreBreakdown.hasGrowthSignals ? 100 : 20 },
                                      { name: 'Tech', value: store.scoreBreakdown.hasTechGaps ? 100 : 20 },
                                      { name: 'Traffic', value: store.scoreBreakdown.hasHighTraffic ? 100 : 20 },
                                      { name: 'Social', value: store.scoreBreakdown.hasSocialPresence ? 100 : 20 },
                                      { name: 'Authority', value: store.scoreBreakdown.hasStrongFounder ? 100 : 20 },
                                      { name: 'Verify', value: store.scoreBreakdown.isVerifiable ? 100 : 20 },
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.value === 100 ? '#FF5C00' : '#E2E8F0'} />
                                    ))
                                  }
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.hasEmail ? "Verified Email Found" : "No Verified Email"}>
                              <Mail className={`w-4 h-4 ${store.scoreBreakdown.hasEmail ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.hasAds ? "Active Ads Detected" : "No Active Ads"}>
                              <Megaphone className={`w-4 h-4 ${store.scoreBreakdown.hasAds ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.hasFounder ? "Founder Info Clear" : "Missing Founder Info"}>
                              <User className={`w-4 h-4 ${store.scoreBreakdown.hasFounder ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.hasGrowthSignals ? "Growth Signals Detected" : "No Growth Signals"}>
                              <TrendingUp className={`w-4 h-4 ${store.scoreBreakdown.hasGrowthSignals ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.hasTechGaps ? "Tech Gaps Identified" : "No Tech Gaps"}>
                              <Zap className={`w-4 h-4 ${store.scoreBreakdown.hasTechGaps ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.hasHighTraffic ? "High Traffic Detected" : "Low Traffic"}>
                              <BarChart3 className={`w-4 h-4 ${store.scoreBreakdown.hasHighTraffic ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.hasSocialPresence ? "Strong Social Engagement" : "Low Social Presence"}>
                              <Instagram className={`w-4 h-4 ${store.scoreBreakdown.hasSocialPresence ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.hasStrongFounder ? "Founder Authority Detected" : "Low Founder Presence"}>
                              <Users className={`w-4 h-4 ${store.scoreBreakdown.hasStrongFounder ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                            <div className="flex items-center gap-1" title={store.scoreBreakdown.isVerifiable ? "High Verifiability" : "Low Verifiability"}>
                              <CheckCircle2 className={`w-4 h-4 ${store.scoreBreakdown.isVerifiable ? 'text-emerald-500' : 'text-text-muted'}`} />
                            </div>
                          </div>
                        </div>
                      )}
                      {store.dataSources && store.dataSources.length > 0 && (
                        <div className="pt-4 border-t border-border-soft mt-4">
                          <p className="text-[10px] text-text-muted uppercase font-bold mb-3 tracking-widest">Intelligence Sources</p>
                          <div className="flex flex-col gap-2">
                            {store.dataSources
                              .filter(source => {
                                try {
                                  const url = new URL(source);
                                  return !url.hostname.includes('run.app') && !url.hostname.includes('localhost');
                                } catch { return true; }
                              })
                              .slice(0, 4)
                              .map((source, i) => {
                                let label = 'Source';
                                try {
                                  label = new URL(source).hostname.replace('www.', '');
                                } catch {}
                                return (
                                  <a 
                                    key={i} 
                                    href={source} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-primary hover:text-brand-secondary flex items-center justify-between group/source transition-colors bg-bg-card p-2.5 rounded-xl border border-border-soft shadow-sm"
                                  >
                                    <span className="truncate flex-1 font-bold">{label}</span>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover/source:opacity-100 transition-opacity" />
                                  </a>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                <div className="flex items-center justify-between pt-8 border-t border-border-soft mt-auto">
                    <div className="flex gap-6">
                      <button 
                        onClick={() => handleVerifyLead(store)}
                        disabled={verifyingUrls.has(store.url)}
                        className="text-text-muted hover:text-brand-primary transition-colors"
                        title="Verify Data"
                      >
                        {verifyingUrls.has(store.url) ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={18} strokeWidth={1.5} />
                        )}
                      </button>
                      <button 
                        onClick={() => handleGenerateEmail(store)}
                        className="text-text-muted hover:text-brand-primary transition-colors"
                        title="Draft Intent"
                      >
                        <MessageSquare size={18} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="flex items-center gap-6">
                      {activeTab === 'search' ? (
                        <button 
                          onClick={() => saveLeads([store])}
                          disabled={savedLeads.some(l => l.url === store.url)}
                          className="text-[10px] font-bold text-text-main uppercase tracking-[0.3em] disabled:text-text-muted/30 transition-colors hover:text-brand-primary"
                        >
                          {savedLeads.some(l => l.url === store.url) ? 'Archived' : 'Archive'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => removeLead(store.url)}
                          className="text-[10px] font-bold text-text-muted hover:text-rose-500 uppercase tracking-[0.3em] transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          ) : (
             <div className="text-center py-24">
                <p className="text-text-muted font-medium text-lg">
                  {activeTab === 'search' ? 'No stores found. Try a broader search.' : activeTab === 'pipeline' ? 'Your pipeline is empty. Save some leads first!' : 'You haven\'t saved any leads to your CRM yet.'}
                </p>
             </div>
          )}
        </AnimatePresence>
      </div>
    )}

        {/* Outreach Modal */}
        <AnimatePresence>
          {selectedLeadForTemplate && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-bg-card border border-border-soft w-full max-w-2xl rounded-[32px] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-heading font-bold text-text-main">Ghostwriter AI</h3>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">Hyper-Personalized Outreach</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedLeadForTemplate(null); setGhostwrittenEmail(null); }} className="text-text-muted hover:text-rose-500 p-2 transition-colors rounded-full hover:bg-rose-50">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-bg-main rounded-[24px] p-6 md:p-8 border border-border-soft mb-8 min-h-[240px] flex flex-col justify-center">
                  {isGeneratingEmail ? (
                    <div className="text-center space-y-6">
                      <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto" />
                      <p className="text-sm font-bold text-text-muted animate-pulse">Ghostwriter is researching {selectedLeadForTemplate.name}...</p>
                    </div>
                  ) : ghostwrittenEmail ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-text-main leading-relaxed font-medium">
                      {ghostwrittenEmail}
                    </pre>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-sm font-medium text-text-muted">Failed to generate email. Try again.</p>
                      <button 
                        onClick={() => handleGenerateEmail(selectedLeadForTemplate)}
                        className="text-brand-primary font-bold text-xs uppercase tracking-widest hover:underline"
                      >
                        Retry Generation
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    disabled={isGeneratingEmail || !ghostwrittenEmail}
                    onClick={() => {
                      if (ghostwrittenEmail) {
                        copyToClipboard(ghostwrittenEmail);
                        setSelectedLeadForTemplate(null);
                        setGhostwrittenEmail(null);
                      }
                    }}
                    className="flex-1 brand-button py-4 text-sm disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" /> Copy Email
                  </button>
                  <button 
                    disabled={isGeneratingEmail}
                    onClick={() => handleGenerateEmail(selectedLeadForTemplate)}
                    className="flex-1 bg-bg-card hover:bg-bg-main text-text-main border-2 border-border-soft font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 text-sm"
                  >
                    <Zap className="w-4 h-4 text-brand-primary" /> Regenerate
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>

    {/* Footer */}
    <footer className="p-8 border-t border-border-soft text-center bg-bg-card">
      <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
        &copy; {new Date().getFullYear()} ShopHunter.ai. Powered by BrandScout Agent.
      </p>
    </footer>
  </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}
