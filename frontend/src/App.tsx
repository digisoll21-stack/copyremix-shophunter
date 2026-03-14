import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { Logo } from "./components/Logo";
import { DashboardSkeleton, StrategySkeleton, IntentSkeleton } from "./components/Skeleton";
import { Dashboard } from "./components/Dashboard";
import { OutreachCenter } from "./components/OutreachCenter";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  Search,
  Globe,
  Instagram,
  Facebook,
  ExternalLink,
  Loader2,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  DollarSign,
  Megaphone,
  Mail,
  ShieldCheck,
  Activity,
  Box,
  Download,
  Upload,
  Save,
  Trash2,
  CheckCircle2,
  User,
  Shield,
  Linkedin,
  Twitter,
  MessageSquare,
  Copy,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  Zap,
  Lock,
  Unlock,
  CheckCircle,
  Target,
  Share2,
  TrendingUp,
  Users,
  BarChart3,
  AlertCircle,
  X,
  Menu,
  LayoutDashboard,
  Scale,
} from "lucide-react";
import {
  findEcomBrands,
  verifyLeadData,
  generateGhostwrittenEmail,
} from "@shared/services/gemini.ts";
import { revealVerifiedEmail } from "@shared/services/leadEnrichment.ts";
import {
  EcomStore,
  SearchState,
  BusinessProfile,
  Intent,
  ProgressUpdate,
} from "@shared/types.ts";
import { connectSocket } from "./services/socket.ts";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { StrategyCentre } from "./components/StrategyCentre";
import { IntentCenter } from "./components/IntentCenter";
import { AdminPanel } from "./components/AdminPanel";
import { PricingPlan } from "./components/PricingPlan";
import { LegalPage } from "./components/LegalPage";
import { supabase } from "./lib/supabase.ts";
import { api } from "./lib/api.ts";
import { User as SupabaseUser } from "@supabase/supabase-js";

export default function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showLegal, setShowLegal] = useState<"privacy" | "terms" | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Mock user for UI/UX testing
  const mockUser: any = {
    id: "mock-user-id",
    email: "demo@example.com",
    user_metadata: { full_name: "Demo User" }
  };
  const [state, setState] = useState<SearchState>({
    query: "",
    filters: {
      revenue: "",
      region: "",
      adStatus: "all",
      techGap: "",
    },
    results: [],
    isSearching: false,
    error: null,
    forceFresh: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [savedLeads, setSavedLeads] = useState<EcomStore[]>([]);
  const [activeTab, setActiveTab] = useState<
    | "saved"
    | "pipeline"
    | "strategy"
    | "intent"
    | "pricing"
    | "dashboard"
    | "outreach"
    | "admin"
  >("dashboard");
  const [userRole, setUserRole] = useState<string>("USER");
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>(
    [],
  );
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [ghostwrittenEmail, setGhostwrittenEmail] = useState<string | null>(
    null,
  );

  // Sync user role with auth state
  React.useEffect(() => {
    if (user?.email === 'digisoll21@gmail.com' || user?.email === 'demo@example.com') {
      setUserRole('SUPERADMIN');
    }
  }, [user]);

  // Auth state listener
  React.useEffect(() => {
    // For UI/UX testing, we'll use a mock user if not authenticated
    if (!supabase) {
      setUser(mockUser);
      setIsAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? mockUser);
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? mockUser);
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initial data fetch and socket connection
  React.useEffect(() => {
    if (!user) return;

    const socket = connectSocket(user.id);

    socket.on(
      "lead:found",
      ({ jobId, lead }: { jobId: string; lead: EcomStore }) => {
        setSavedLeads((prev) => {
          if (prev.find((l) => l.url === lead.url)) return prev;
          return [lead, ...prev];
        });
        setState((prev) => {
          if (prev.results.find((l) => l.url === lead.url)) return prev;
          return {
            ...prev,
            results: [lead, ...prev.results],
          };
        });
        toast.success(`New lead found: ${lead.name}`, {
          description: lead.niche,
          duration: 2000,
        });
      },
    );

    socket.on(
      "job:progress",
      ({
        jobId,
        progress,
        detail,
      }: {
        jobId: string;
        progress: string;
        detail: ProgressUpdate;
      }) => {
        setJobProgress(progress);
        setJobProgressDetail(detail);
      },
    );

    socket.on(
      "job:status",
      ({
        jobId,
        status,
        progress,
        count,
        detail,
      }: {
        jobId: string;
        status: string;
        progress: string;
        count?: number;
        detail?: ProgressUpdate;
      }) => {
        setJobProgress(progress);
        if (detail) setJobProgressDetail(detail);

        if (status === "completed") {
          setState((prev) => ({ ...prev, isSearching: false }));
          setActiveJobId(null);
          setJobProgress(null);
          setJobProgressDetail(null);
          toast.success(`Discovery completed! Found ${count} leads.`);
        } else if (status === "failed") {
          setState((prev) => ({
            ...prev,
            isSearching: false,
            error: progress,
          }));
          setActiveJobId(null);
          setJobProgress(null);
          setJobProgressDetail(null);
          toast.error(`Discovery failed: ${progress}`);
        }
      },
    );

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [leads, profiles, me] = await Promise.all([
          api.get("/api/leads"),
          api.get("/api/profiles"),
          api.get("/api/me"),
        ]);
        
        if (me && me.role) {
          setUserRole(me.role);
        } else if (user?.email === 'digisoll21@gmail.com' || user?.email === 'demo@example.com') {
          setUserRole('SUPERADMIN');
        }

        setSavedLeads(leads);
        setBusinessProfiles(profiles);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
        toast.error("Failed to sync with database. Using local state.");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();

    return () => {
      socket.disconnect();
    };
  }, [user]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedLeadForTemplate, setSelectedLeadForTemplate] =
    useState<EcomStore | null>(null);
  const [editingNotes, setEditingNotes] = useState<{
    url: string;
    notes: string;
  } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [verifyingUrls, setVerifyingUrls] = useState<Set<string>>(new Set());
  const [verifyingEmails, setVerifyingEmails] = useState<Set<string>>(
    new Set(),
  );
  const [revealingUrls, setRevealingUrls] = useState<Set<string>>(new Set());
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "lead" | "profile";
    id: string;
    name: string;
  } | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<string | null>(null);
  const [jobProgressDetail, setJobProgressDetail] =
    useState<ProgressUpdate | null>(null);

  const generateTemplate = (store: EcomStore) => {
    const name = store.founderInfo?.name?.split(" ")[0] || "there";
    const niche = store.niche || "your store";
    const apps = store.apps?.slice(0, 2).join(" and ") || store.platform;
    const email = store.isEmailRevealed
      ? store.revealedEmail
      : store.founderInfo?.personalEmail || store.contactEmail || "[Email]";

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
      toast.error(
        "Please create a business profile in the Strategy Centre first.",
      );
      setActiveTab("strategy");
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
    toast.success("Copied to clipboard");
  };

  const saveLeads = async (leads: EcomStore[]) => {
    try {
      await api.post("/api/leads", leads);

      setSavedLeads((prev) => {
        const newLeads = [...prev];
        leads.forEach((lead) => {
          if (!newLeads.find((l) => l.url === lead.url)) {
            newLeads.push({ ...lead, status: "New" });
          }
        });
        return newLeads;
      });
      toast.success(`Saved ${leads.length} leads to database`);
    } catch (err) {
      console.error("Failed to save leads", err);
      toast.error("Failed to save leads to database");
    }
  };

  const updateLeadStatus = async (url: string, status: any) => {
    try {
      await api.patch(`/api/leads/${encodeURIComponent(url)}`, { status });

      setSavedLeads((prev) =>
        prev.map((l) => (l.url === url ? { ...l, status } : l)),
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const updateLeadNotes = async (url: string, notes: string) => {
    try {
      await api.patch(`/api/leads/${encodeURIComponent(url)}`, { notes });

      setSavedLeads((prev) =>
        prev.map((l) => (l.url === url ? { ...l, notes } : l)),
      );
    } catch (err) {
      console.error("Failed to update notes", err);
    }
    setEditingNotes(null);
  };

  const removeLead = async (url: string) => {
    const lead = savedLeads.find((l) => l.url === url);
    if (!lead) return;
    setDeleteConfirmation({ type: "lead", id: url, name: lead.name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    const { type, id } = deleteConfirmation;

    try {
      if (type === "lead") {
        await api.delete(`/api/leads/${encodeURIComponent(id)}`);
        setSavedLeads((prev) => prev.filter((l) => l.url !== id));
        toast.success("Lead removed successfully");
      } else if (type === "profile") {
        await api.delete(`/api/profiles/${id}`);
        setBusinessProfiles((prev) => prev.filter((p) => p.id !== id));
        toast.success("Business Hub deleted successfully");
      }
    } catch (err) {
      console.error(`Failed to delete ${type}`, err);
      toast.error(`Failed to delete ${type}. Please try again.`);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const exportToCSV = (leads: EcomStore[]) => {
    const headers = [
      "Name",
      "URL",
      "Platform",
      "Niche",
      "Revenue",
      "Ads Live",
      "Ad Spend",
      "Scaling Status",
      "AOV",
      "Creative Style",
      "Retargeting",
      "Ad Themes",
      "Marketing Hook",
      "Primary Platform",
      "SEO Keywords",
      "SEO Gaps",
      "Organic Opportunity",
      "SEO Strategy",
      "Email",
      "Apps",
      "Founder Name",
      "Founder Title",
      "Founder LinkedIn",
      "Founder Twitter",
      "Founder Instagram",
      "Founder Facebook",
      "Founder Email",
      "Instagram",
      "Facebook",
    ];
    const rows = leads.map((l) => [
      l.name,
      l.url,
      l.platform,
      l.niche,
      l.estimatedRevenue || "N/A",
      l.isRunningAds ? "Yes" : "No",
      l.adInsights?.estimatedSpend || "N/A",
      l.adInsights?.scalingStatus || "Stable",
      l.adInsights?.estimatedAOV || "N/A",
      l.adInsights?.creativeStyle || "N/A",
      l.adInsights?.retargetingEnabled ? "Yes" : "No",
      l.adInsights?.adCopyThemes?.join("; ") || "N/A",
      l.adInsights?.marketingHook || "N/A",
      l.adInsights?.primaryAdPlatform || "N/A",
      l.seoInsights?.topKeywords?.join("; ") || "N/A",
      l.seoInsights?.seoGaps?.join("; ") || "N/A",
      l.seoInsights?.organicOpportunity || "N/A",
      l.seoInsights?.seoStrategy || "N/A",
      l.contactEmail || "N/A",
      l.apps?.join("; ") || "N/A",
      l.founderInfo?.name || "N/A",
      l.founderInfo?.title || "N/A",
      l.founderInfo?.linkedin || "N/A",
      l.founderInfo?.twitter || "N/A",
      l.founderInfo?.instagram || "N/A",
      l.founderInfo?.facebook || "N/A",
      l.founderInfo?.personalEmail || "N/A",
      l.socialLinks?.instagram || "",
      l.socialLinks?.facebook || "",
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ecom_leads_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
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
      const urls = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("http"));

      if (urls.length > 0) {
        setState((prev) => ({ ...prev, isSearching: true, error: null }));
        try {
          // Process in batches or just use the first few for demo
          const query = `Analyze these specific stores: ${urls.slice(0, 5).join(", ")}`;
          const stores = await findEcomBrands(query, state.filters);
          setSavedLeads((prev) => {
            const newStores = stores.filter(
              (s) => !prev.some((l) => l.url === s.url)
            );
            return [...newStores, ...prev];
          });
          setState((prev) => ({
            ...prev,
            results: stores,
            isSearching: false,
          }));
          setActiveTab("saved");
        } catch (err) {
          setState((prev) => ({
            ...prev,
            isSearching: false,
            error: "Failed to analyze imported URLs",
          }));
        }
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleSearch = async (
    e?: React.FormEvent,
    overrideQuery?: string,
    overrideMission?: Intent,
  ) => {
    if (e) e.preventDefault();
    const queryToUse = overrideQuery || state.query;
    if (!queryToUse.trim()) return;

    setState((prev) => ({
      ...prev,
      query: queryToUse,
      isSearching: true,
      results: [], // Clear results for new search
      error: null,
      activeMission:
        overrideMission || (overrideQuery ? prev.activeMission : undefined),
    }));
    setActiveAgent("Brand Scout");
    setJobProgress("Initializing Discovery...");

    try {
      const { jobId } = await api.post("/api/leads/hunt", {
        query: queryToUse,
        filters: state.filters,
        mission:
          overrideMission ||
          (overrideQuery ? state.activeMission : undefined),
      });

      setActiveJobId(jobId);
      toast.info(
        "Discovery started in background. You can leave this page and results will continue to sync.",
      );
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSearching: false,
        error:
          err instanceof Error ? err.message : "An unexpected error occurred",
      }));
      setActiveAgent(null);
      setJobProgress(null);
    }
  };

  const handleSaveBusinessProfile = async (profile: BusinessProfile) => {
    try {
      await api.post("/api/profiles", profile);

      setBusinessProfiles((prev) => {
        const existingIdx = prev.findIndex((p) => p.id === profile.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = profile;
          return updated;
        }
        return [...prev, profile];
      });
      toast.success("Business profile saved");
    } catch (err) {
      console.error("Failed to save profile", err);
    }
  };

  const handleDeleteBusinessProfile = (id: string) => {
    const profile = businessProfiles.find((p) => p.id === id);
    if (!profile) return;
    setDeleteConfirmation({ type: "profile", id, name: profile.name });
  };

  const handleHuntLeads = (intent: Intent) => {
    toast.success(`Deploying Agent Squad for ${intent.title}...`);
    handleSearch(undefined, intent.searchQuery, intent);
  };

  const handleVerifyLead = async (lead: EcomStore) => {
    setVerifyingUrls((prev) => new Set(prev).add(lead.url));
    setActiveAgent("Agent Squad");
    try {
      // Find the active business profile to pass to the Deal Closer
      const activeProfile = businessProfiles[0]; // For now, use the first one if it exists
      const verified = await verifyLeadData(lead, activeProfile);

      // Update in search results
      setState((prev) => ({
        ...prev,
        results: prev.results.map((l) => (l.url === lead.url ? verified : l)),
      }));

      // Update in saved leads
      const isSaved = savedLeads.find((l) => l.url === lead.url);
      if (isSaved) {
        await api.patch(`/api/leads/${encodeURIComponent(lead.url)}`, { data: verified });
        setSavedLeads((prev) =>
          prev.map((l) => (l.url === lead.url ? verified : l)),
        );
      }
      toast.success("Intelligence Squad: Data Verified & Enriched");
    } catch (err) {
      console.error("Verification failed", err);
      toast.error("Squad enrichment failed. Please try again.");
    } finally {
      setVerifyingUrls((prev) => {
        const next = new Set(prev);
        next.delete(lead.url);
        return next;
      });
      setActiveAgent(null);
    }
  };

  const handleRevealEmail = async (lead: EcomStore) => {
    setRevealingUrls((prev) => new Set(prev).add(lead.url));
    setActiveAgent("Verification Guard");
    try {
      const { email, source } = await revealVerifiedEmail(lead);

      const updatedLead = {
        ...lead,
        isEmailRevealed: true,
        revealedEmail: email,
        dataSources: [...(lead.dataSources || []), source].filter(
          (v, i, a) => a.indexOf(v) === i,
        ),
      };

      // Update in search results
      setState((prev) => ({
        ...prev,
        results: prev.results.map((l) =>
          l.url === lead.url ? updatedLead : l,
        ),
      }));

      // Update in saved leads
      const isSaved = savedLeads.find((l) => l.url === lead.url);
      if (isSaved) {
        await api.patch(`/api/leads/${encodeURIComponent(lead.url)}`, { data: updatedLead });
        setSavedLeads((prev) =>
          prev.map((l) => (l.url === lead.url ? updatedLead : l)),
        );
      }

      toast.success(`Email revealed: ${email}`);
    } catch (err) {
      console.error("Email reveal failed", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to reveal email. Please try again.",
      );
    } finally {
      setRevealingUrls((prev) => {
        const next = new Set(prev);
        next.delete(lead.url);
        return next;
      });
      setActiveAgent(null);
    }
  };

  const handleVerifyEmail = async (lead: EcomStore) => {
    const email =
      lead.revealedEmail ||
      lead.founderInfo?.personalEmail ||
      lead.contactEmail;
    if (!email) {
      toast.error("No email address found to verify.");
      return;
    }

    setVerifyingEmails((prev) => new Set(prev).add(lead.url));
    setActiveAgent("Verification Guard");

    try {
      const result = await api.post("/api/leads/verify-email", { url: lead.url, email });

      if (result.success) {
        const updatedLead = result.lead;

        // Update in search results
        setState((prev) => ({
          ...prev,
          results: prev.results.map((l) =>
            l.url === lead.url ? updatedLead : l,
          ),
        }));

        // Update in saved leads
        setSavedLeads((prev) =>
          prev.map((l) => (l.url === lead.url ? updatedLead : l)),
        );

        toast.success(`Email verified successfully: ${email}`);
      } else {
        toast.error(result.message || "Email verification failed.");
      }
    } catch (err) {
      console.error("Email verification failed", err);
      toast.error("Failed to connect to verification service.");
    } finally {
      setVerifyingEmails((prev) => {
        const next = new Set(prev);
        next.delete(lead.url);
        return next;
      });
      setActiveAgent(null);
    }
  };

  if (showLegal) {
    return (
      <LegalPage
        type={showLegal}
        onBack={() => setShowLegal(null)}
      />
    );
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    if (showLanding) {
      return (
        <LandingPage
          onStart={() => {
            setShowLanding(false);
            setShowAuth(true);
          }}
          onPrivacy={() => setShowLegal("privacy")}
          onTerms={() => setShowLegal("terms")}
        />
      );
    }

    return (
      <AuthPage
        onComplete={() => {
          setShowAuth(false);
        }}
      />
    );
  }

  if (showPricing) {
    return (
      <div className="min-h-screen bg-bg-main relative selection:bg-brand-primary/20">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#064E3B_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(at_0%_0%,rgba(16,185,129,0.05)_0px,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(at_100%_100%,rgba(255,92,0,0.05)_0px,transparent_50%)]" />
        </div>
        <div className="relative z-10 flex flex-col min-h-screen justify-center">
          <PricingPlan
            onSelect={async (plan) => {
              try {
                const response = await api.post("/api/billing/checkout", { planName: plan });
                if (response.url) {
                  window.location.href = response.url;
                } else {
                  toast.error("Failed to create checkout session");
                }
              } catch (err) {
                console.error("Checkout error:", err);
                toast.error("An error occurred during checkout");
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-main selection:bg-brand-primary/20 relative">
      {/* Background Grid & Gradients (Consistent with Landing Page) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#064E3B_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(at_0%_0%,rgba(16,185,129,0.05)_0px,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(at_100%_100%,rgba(255,92,0,0.05)_0px,transparent_50%)]" />
      </div>

      {/* Unified Header */}
      <header className="bg-bg-card/70 backdrop-blur-xl border-b border-border-soft sticky top-0 z-[100] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-text-main hover:bg-bg-main rounded-lg transition-colors"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Target className="text-white w-4 h-4" />
            </div>
            <span className="text-xl font-heading font-bold text-text-main tracking-tight hidden sm:block">
              ShopHunter
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {(userRole === "ADMIN" || userRole === "SUPERADMIN") && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`p-2 rounded-lg transition-colors ${activeTab === "admin" ? "bg-brand-primary/20 text-brand-primary" : "text-text-muted hover:text-text-main hover:bg-bg-main"}`}
              title="Admin Panel"
            >
              <Shield size={20} strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={() => setActiveTab("pricing")}
            className="px-4 py-2 bg-brand-primary/10 text-brand-primary text-sm font-bold rounded-lg hover:bg-brand-primary/20 transition-colors"
          >
            Upgrade
          </button>
          <button
            onClick={() => supabase?.auth.signOut()}
            className="p-2 text-text-muted hover:text-text-main hover:bg-bg-main rounded-lg transition-colors"
            title="Sign Out"
          >
            <Lock size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Slide-in Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-text-main/20 backdrop-blur-sm z-[110]"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-screen w-72 bg-bg-card/95 backdrop-blur-xl border-r border-border-soft z-[120] flex flex-col shadow-2xl"
            >
              <div className="p-6 flex items-center justify-between border-b border-border-soft">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20">
                    <Target className="text-white w-4 h-4" />
                  </div>
                  <span className="text-xl font-heading font-bold text-text-main tracking-tight">
                    ShopHunter
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-text-muted hover:text-text-main hover:bg-bg-main rounded-lg transition-colors"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col justify-between">
                <nav className="space-y-2">
                  {[
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      icon: LayoutDashboard,
                    },
                    { id: "strategy", label: "Intelligence Hub", icon: Sparkles },
                    { id: "intent", label: "Intent Center", icon: Target },
                    {
                      id: "outreach",
                      label: "Outreach Center",
                      icon: Mail,
                    },
                    {
                      id: "pipeline",
                      label: "Growth Pipeline",
                      icon: Activity,
                    },
                    {
                      id: "saved",
                      label: "Client CRM",
                      icon: Users,
                      badge: savedLeads.length,
                    },
                    ...((userRole === "ADMIN" || userRole === "SUPERADMIN") ? [{
                      id: "admin",
                      label: "Super Admin",
                      icon: Shield,
                    }] : []),
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                        activeTab === item.id
                          ? "bg-text-main text-white shadow-lg shadow-text-main/10"
                          : "text-text-muted hover:text-text-main hover:bg-bg-main"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={`w-4 h-4 ${activeTab === item.id ? "text-white" : "text-text-muted"}`}
                        />
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === item.id ? "bg-white/20 text-white" : "bg-bg-main text-text-muted"}`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  ))}

                  <div className="pt-8 px-2">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-[0.3em] mb-4">
                      Management
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab("pricing");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-2 py-2 text-sm transition-all ${
                        activeTab === "pricing"
                          ? "text-brand-primary"
                          : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span className="font-medium">Billing & Usage</span>
                    </button>
                  </div>
                  <div className="pt-8 px-2">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-[0.3em] mb-4">
                      Legal
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowLegal("privacy")}
                        className="w-full flex items-center gap-3 px-2 py-2 text-sm text-text-muted hover:text-text-main transition-all"
                      >
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Privacy Policy</span>
                      </button>
                      <button
                        onClick={() => setShowLegal("terms")}
                        className="w-full flex items-center gap-3 px-2 py-2 text-sm text-text-muted hover:text-text-main transition-all"
                      >
                        <Scale className="w-4 h-4" />
                        <span className="font-medium">Terms of Service</span>
                      </button>
                    </div>
                  </div>
                </nav>

                <div className="space-y-6 mt-8">
                  <label className="cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-text-main hover:bg-bg-main transition-all group">
                    <Upload className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                    <span>Import Dataset</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleCSVImport}
                    />
                  </label>

                  <div className="p-5 bg-bg-main rounded-2xl border border-border-soft">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-[0.3em]">
                        Usage
                      </p>
                      <p className="text-xs font-bold text-brand-primary">
                        12%
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-white rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-brand-primary w-[12%]" />
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("pricing");
                        setIsMobileMenuOpen(false);
                      }}
                      className="brand-button w-full py-2 text-xs font-bold uppercase tracking-widest rounded-lg"
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div
            className={`max-w-[1800px] mx-auto w-full ${activeTab === "strategy" ? "" : "px-6 py-12 md:px-12 md:py-20"}`}
          >
            {/* Global Progress Bar */}
            {state.isSearching && (
              <div className="mb-8">
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
                        <p className="text-xs font-bold text-brand-primary uppercase tracking-[0.3em] mb-1">
                          Intelligence Agents Active
                        </p>
                        <h3 className="text-xl font-heading font-bold text-text-main tracking-tight">
                          {jobProgressDetail?.step ||
                            "Synchronizing Intelligence..."}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                          Progress
                        </p>
                        <p className="text-3xl font-heading font-bold text-text-main">
                          {jobProgressDetail?.percentage || 0}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                          Leads Found
                        </p>
                        <p className="text-3xl font-heading font-bold text-text-main">
                          {state.results.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="w-full h-2 bg-bg-main rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${jobProgressDetail?.percentage || 0}%`,
                        }}
                        className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500 ease-out"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] text-text-muted font-medium italic">
                        {jobProgressDetail?.details ||
                          "Initializing agents..."}
                      </p>
                      {jobProgressDetail?.agentName && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_10px_rgba(255,92,0,0.5)]" />
                          <p className="text-xs font-bold text-text-main uppercase tracking-widest">
                            Active: {jobProgressDetail.agentName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {isLoadingData ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === "strategy" ? (
                    <StrategySkeleton />
                  ) : activeTab === "intent" ? (
                    <IntentSkeleton />
                  ) : (
                    <DashboardSkeleton />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeTab === "dashboard" && (
                    <Dashboard savedLeads={savedLeads} user={user} />
                  )}

                  {activeTab === "strategy" && (
                    <StrategyCentre
                      profiles={businessProfiles}
                      onSaveProfile={handleSaveBusinessProfile}
                      onDeleteProfile={handleDeleteBusinessProfile}
                      onHuntLeads={handleHuntLeads}
                    />
                  )}

                  {activeTab === "intent" && (
                    <IntentCenter
                      intents={businessProfiles.flatMap((p) => p.intents || [])}
                      onDeploy={handleHuntLeads}
                    />
                  )}

                  {activeTab === "outreach" && (
                    <OutreachCenter savedLeads={savedLeads} />
                  )}

                  {activeTab === "admin" && (
                    <AdminPanel />
                  )}

                  {activeTab === "pricing" && (
                    <PricingPlan
                      onSelect={async (plan) => {
                        try {
                          const response = await api.post("/api/billing/checkout", { planName: plan });
                          if (response.url) {
                            window.location.href = response.url;
                          } else {
                            toast.error("Failed to create checkout session");
                          }
                        } catch (err) {
                          console.error("Checkout error:", err);
                          toast.error("An error occurred during checkout");
                        }
                      }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
              {((activeTab === "saved" && savedLeads.length > 0) ||
                (activeTab === "pipeline" && savedLeads.length > 0)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 p-8 glass-card rounded-3xl"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                      <BarChart3
                        size={20}
                        strokeWidth={1.5}
                        className="text-white"
                      />
                    </div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-[0.4em]">
                      {activeTab === "saved"
                          ? "Intelligence CRM"
                          : "Strategic Flow"}{" "}
                      (
                      {savedLeads.length}{" "}
                      leads)
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() =>
                        exportToCSV(savedLeads)
                      }
                      className="brand-button px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] rounded-xl"
                    >
                      Export Intelligence
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            {(activeTab === "saved" ||
              activeTab === "pipeline") && (
              <div className="space-y-8">
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
                        onClick={() =>
                          setState((prev) => ({ ...prev, error: null }))
                        }
                        className="mt-4 text-sm font-bold underline hover:text-red-700 transition-colors"
                      >
                        Try again
                      </button>
                    </motion.div>
                  ) : activeTab === "pipeline" && savedLeads.length > 0 ? (
                    <div className="space-y-16">
                      <div>
                        <p className="text-xs font-bold text-brand-primary uppercase tracking-[0.4em] mb-6">
                          Strategic Flow
                        </p>
                        <h2 className="text-5xl font-heading font-bold text-text-main tracking-tight">
                          Sales Pipeline
                        </h2>
                      </div>
                      <motion.div
                        key="pipeline"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex overflow-x-auto pb-12 gap-8 snap-x"
                      >
                        {(
                          [
                            "New",
                            "Contacted",
                            "Follow-up",
                            "Qualified",
                            "Closed",
                            "Lost",
                          ] as const
                        ).map((status) => (
                          <div
                            key={status}
                            className="flex flex-col gap-8 min-w-[320px] snap-start"
                          >
                            <div className="flex items-center justify-between border-b border-border-soft pb-4">
                              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted">
                                {status}
                              </h3>
                              <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                                {
                                  savedLeads.filter((l) => l.status === status)
                                    .length
                                }
                              </span>
                            </div>
                            <div className="flex flex-col gap-6 min-h-[500px]">
                              {savedLeads
                                .filter((l) => l.status === status)
                                .map((lead) => (
                                  <motion.div
                                    key={lead.url}
                                    id={`lead-card-${lead.url.replace(/[^a-zA-Z0-9]/g, "-")}`}
                                    layoutId={lead.url}
                                    className="glass-card p-8 rounded-3xl hover:border-brand-primary/30 transition-all cursor-pointer group"
                                    onClick={() => handleGenerateEmail(lead)}
                                  >
                                    <h4 className="text-xl font-heading font-bold text-text-main mb-2 truncate">
                                      {lead.name}
                                    </h4>
                                    <p className="text-xs text-text-muted uppercase tracking-[0.1em] font-bold truncate mb-8">
                                      {lead.niche}
                                    </p>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">
                                        {lead.estimatedRevenue || "N/A"}
                                      </span>
                                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleGenerateEmail(lead);
                                          }}
                                          className="text-text-muted hover:text-text-main"
                                        >
                                          <MessageSquare
                                            size={14}
                                            strokeWidth={1.5}
                                          />
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
                  ) : savedLeads.length > 0 ? (
                    <div className="space-y-8">
                      {activeTab === "saved" && (
                        <div>
                          <h2 className="text-3xl font-heading font-bold text-text-main tracking-tight">
                            Leads CRM
                          </h2>
                          <p className="text-text-muted mt-2">
                            Manage your saved prospects and update their CRM
                            status.
                          </p>
                        </div>
                      )}
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                        {savedLeads.map((store, index) => (
                          <motion.div
                            key={store.url}
                            id={`lead-card-${store.url.replace(/[^a-zA-Z0-9]/g, "-")}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-8 rounded-[32px] hover:border-brand-primary/30 transition-all group flex flex-col h-full relative"
                          >
                            <div className="flex justify-between items-start mb-8">
                              <div className="w-12 h-12 bg-bg-main rounded-xl border border-border-soft flex items-center justify-center group-hover:border-brand-primary group-hover:bg-brand-primary/5 transition-all">
                                <Globe
                                  size={20}
                                  strokeWidth={1.5}
                                  className="text-text-muted group-hover:text-brand-primary transition-colors"
                                />
                              </div>
                              <div className="flex flex-col items-end gap-4">
                                <div className="flex gap-4">
                                  <select
                                    value={store.status || "New"}
                                    onChange={(e) =>
                                      updateLeadStatus(
                                        store.url,
                                        e.target.value as any,
                                      )
                                    }
                                    className="text-xs font-bold bg-transparent text-brand-primary border-b border-brand-primary/30 outline-none cursor-pointer uppercase tracking-widest"
                                  >
                                    <option value="New">NEW</option>
                                    <option value="Contacted">
                                      CONTACTED
                                    </option>
                                    <option value="Follow-up">
                                      FOLLOW-UP
                                    </option>
                                    <option value="Qualified">
                                      QUALIFIED
                                    </option>
                                    <option value="Closed">CLOSED</option>
                                    <option value="Lost">LOST</option>
                                  </select>
                                  {store.isRunningAds && (
                                    <div className="text-xs font-bold text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
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
                                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                                    Estimated Revenue
                                  </p>
                                  <p className="text-lg font-heading font-bold text-text-main">
                                    {store.estimatedRevenue || "N/A"}
                                  </p>
                                </div>
                                <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/20">
                                  <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">
                                    Intent Score
                                  </p>
                                  <p className="text-lg font-heading font-bold text-brand-primary">
                                    {store.intentScore
                                      ? `${store.intentScore}%`
                                      : "High"}
                                  </p>
                                </div>
                                <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
                                  <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">
                                    Ad Insights
                                  </p>
                                  <p className="text-lg font-heading font-bold text-brand-secondary">
                                    {store.isRunningAds ? "Active" : "Inactive"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-8 mb-10">
                              {store.intentSignals &&
                                store.intentSignals.length > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-4">
                                      Key Signals
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                      {store.intentSignals
                                        .slice(0, 2)
                                        .map((signal, i) => (
                                          <span
                                            key={i}
                                            className="text-xs text-text-main font-medium bg-bg-main border border-border-soft px-3 py-1.5 rounded-lg"
                                          >
                                            {signal}
                                          </span>
                                        ))}
                                    </div>
                                  </div>
                                )}

                              {store.strategicFit && (
                                <div>
                                  <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-4">
                                    Strategic Fit
                                  </p>
                                  <p className="text-sm text-text-main leading-relaxed italic">
                                    "{store.strategicFit}"
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-6 flex-1">
                                <div className="mb-10">
                                  <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">
                                      CRM Intelligence
                                    </p>
                                    <button
                                      onClick={() =>
                                        setEditingNotes({
                                          url: store.url,
                                          notes: store.notes || "",
                                        })
                                      }
                                      className="text-xs text-brand-primary font-bold hover:underline tracking-widest"
                                    >
                                      EDIT
                                    </button>
                                  </div>
                                  <div className="p-6 bg-bg-main rounded-2xl border border-border-soft min-h-[80px]">
                                    {editingNotes?.url === store.url ? (
                                      <div className="space-y-4">
                                        <textarea
                                          value={editingNotes.notes}
                                          onChange={(e) =>
                                            setEditingNotes({
                                              ...editingNotes,
                                              notes: e.target.value,
                                            })
                                          }
                                          className="w-full bg-transparent text-sm text-text-main outline-none resize-none font-medium"
                                          rows={3}
                                          placeholder="Enter intelligence notes..."
                                          autoFocus
                                        />
                                        <div className="flex justify-end gap-6">
                                          <button
                                            onClick={() =>
                                              setEditingNotes(null)
                                            }
                                            className="text-xs text-text-muted font-bold uppercase tracking-widest hover:text-text-main transition-colors"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={() => {
                                              updateLeadNotes(
                                                store.url,
                                                editingNotes.notes,
                                              );
                                              setEditingNotes(null);
                                            }}
                                            className="text-xs text-brand-primary font-bold uppercase tracking-widest hover:underline"
                                          >
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-text-muted font-medium italic leading-relaxed">
                                        {store.notes ||
                                          "No intelligence recorded yet."}
                                      </p>
                                    )}
                                  </div>
                                </div>

                              {store.adInsights && (
                                <div className="mb-10 space-y-6">
                                  <p className="text-xs font-bold text-brand-primary uppercase tracking-[0.2em]">
                                    Ad Intelligence
                                  </p>
                                  <div className="grid grid-cols-2 gap-8">
                                    <div>
                                      <p className="text-xs text-text-muted uppercase tracking-[0.1em] mb-1 font-bold">
                                        Est. Spend
                                      </p>
                                      <p className="text-sm font-heading font-bold text-text-main">
                                        {store.adInsights.estimatedSpend ||
                                          "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-text-muted uppercase tracking-[0.1em] mb-1 font-bold">
                                        Scaling
                                      </p>
                                      <p className="text-sm font-heading font-bold text-text-main">
                                        {store.adInsights.scalingStatus ||
                                          "Stable"}
                                      </p>
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
                                    <User
                                      size={16}
                                      strokeWidth={1.5}
                                      className="text-brand-primary"
                                    />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                                      Decision Maker
                                    </span>
                                  </div>
                                  {store.isEmailRevealed && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary uppercase tracking-widest">
                                      <CheckCircle className="w-4 h-4" />{" "}
                                      Verified
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-bg-card rounded-full border-2 border-bg-card shadow-sm overflow-hidden">
                                        <img
                                          src={`https://picsum.photos/seed/${store.founderInfo?.name || store.name}/100/100`}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="space-y-0.5">
                                        {store.founderInfo?.name && (
                                          <p className="text-sm font-heading font-bold text-text-main">
                                            {store.founderInfo.name}
                                          </p>
                                        )}
                                        {store.founderInfo?.title && (
                                          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">
                                            {store.founderInfo.title}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {store.founderInfo?.linkedin && (
                                        <a
                                          href={store.founderInfo.linkedin}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-2 bg-bg-card border border-border-soft rounded-xl hover:text-brand-primary transition-all hover:scale-110 shadow-sm"
                                        >
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
                                          <span className="text-xs font-bold text-text-main truncate">
                                            {store.revealedEmail}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() =>
                                              copyToClipboard(
                                                store.revealedEmail!,
                                              )
                                            }
                                            className="p-1.5 text-text-muted hover:text-brand-primary transition-colors"
                                            title="Copy Email"
                                          >
                                            <Copy className="w-4 h-4" />
                                          </button>
                                          {store.verificationStatus !==
                                            "Verified" && (
                                            <button
                                              onClick={() =>
                                                handleVerifyEmail(store)
                                              }
                                              disabled={verifyingEmails.has(
                                                store.url,
                                              )}
                                              className="p-1.5 text-brand-primary hover:text-brand-secondary transition-colors"
                                              title="Verify Deliverability"
                                            >
                                              {verifyingEmails.has(
                                                store.url,
                                              ) ? (
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
                                        {(store.contactEmail ||
                                          store.founderInfo?.personalEmail) && (
                                          <div className="flex items-center justify-between bg-bg-card p-3 rounded-xl border border-border-soft shadow-sm">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                              <Mail className="w-4 h-4 text-text-muted shrink-0" />
                                              <span className="text-xs font-medium text-text-muted truncate">
                                                {store.founderInfo
                                                  ?.personalEmail ||
                                                  store.contactEmail}
                                              </span>
                                            </div>
                                            {store.verificationStatus !==
                                              "Verified" && (
                                              <button
                                                onClick={() =>
                                                  handleVerifyEmail(store)
                                                }
                                                disabled={verifyingEmails.has(
                                                  store.url,
                                                )}
                                                className="p-1.5 text-brand-primary hover:text-brand-secondary transition-colors"
                                                title="Verify Deliverability"
                                              >
                                                {verifyingEmails.has(
                                                  store.url,
                                                ) ? (
                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                  <ShieldCheck className="w-4 h-4" />
                                                )}
                                              </button>
                                            )}
                                          </div>
                                        )}
                                        <button
                                          onClick={() =>
                                            handleRevealEmail(store)
                                          }
                                          disabled={revealingUrls.has(
                                            store.url,
                                          )}
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
                                      <a
                                        href={store.founderInfo.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-text-muted hover:text-brand-primary transition-colors"
                                      >
                                        <Twitter className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    {store.founderInfo?.instagram && (
                                      <a
                                        href={store.founderInfo.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-text-muted hover:text-brand-primary transition-colors"
                                      >
                                        <Instagram className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    {store.founderInfo?.facebook && (
                                      <a
                                        href={store.founderInfo.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-text-muted hover:text-brand-primary transition-colors"
                                      >
                                        <Facebook className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    {store.founderInfo?.personalEmail &&
                                      !store.isEmailRevealed && (
                                        <div className="flex items-center gap-1 text-xs text-text-muted">
                                          <Mail className="w-3 h-3" />
                                          <span>Public Email Found</span>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 mb-6">
                              <span className="px-3 py-1 bg-bg-card border border-border-soft rounded-full text-xs uppercase tracking-wider font-bold text-text-muted shadow-sm">
                                {store.niche}
                              </span>
                            </div>

                            {/* Data Intelligence Section */}
                            <div className="mb-10 p-6 bg-bg-main rounded-[24px] border border-border-soft">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck
                                    size={16}
                                    strokeWidth={1.5}
                                    className={
                                      store.confidenceScore &&
                                      store.confidenceScore > 80
                                        ? "text-brand-primary"
                                        : "text-brand-primary"
                                    }
                                  />
                                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
                                    Data Intelligence
                                  </span>
                                </div>
                                {store.confidenceScore && (
                                  <span
                                    className={`text-xs font-bold tracking-widest ${
                                      store.confidenceScore > 85
                                        ? "text-brand-primary"
                                        : store.confidenceScore > 60
                                          ? "text-amber-600"
                                          : "text-rose-600"
                                    }`}
                                  >
                                    {store.confidenceScore}% Confidence
                                  </span>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-text-muted font-bold">
                                    Verification Status:
                                  </span>
                                  <span
                                    className={`font-bold uppercase tracking-widest ${store.verificationStatus === "Squad-Verified" || store.verificationStatus === "Verified" ? "text-brand-primary" : "text-text-muted"}`}
                                  >
                                    {store.verificationStatus || "Unverified"}
                                  </span>
                                </div>
                                {store.lastVerifiedAt && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-text-muted font-bold">
                                      Last Intelligence Sync:
                                    </span>
                                    <span className="text-text-main font-bold">
                                      {new Date(
                                        store.lastVerifiedAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}

                                {store.scoreBreakdown && (
                                  <div className="pt-4 mt-4 border-t border-border-soft">
                                    <p className="text-xs text-text-muted uppercase font-bold mb-3 tracking-widest">
                                      Intelligence Score Breakdown
                                    </p>
                                    <div className="h-24 w-full mb-4">
                                      <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                      >
                                        <BarChart
                                          data={[
                                            {
                                              name: "Email",
                                              value: store.scoreBreakdown
                                                .hasEmail
                                                ? 100
                                                : 20,
                                            },
                                            {
                                              name: "Ads",
                                              value: store.scoreBreakdown.hasAds
                                                ? 100
                                                : 20,
                                            },
                                            {
                                              name: "Founder",
                                              value: store.scoreBreakdown
                                                .hasFounder
                                                ? 100
                                                : 20,
                                            },
                                            {
                                              name: "Growth",
                                              value: store.scoreBreakdown
                                                .hasGrowthSignals
                                                ? 100
                                                : 20,
                                            },
                                            {
                                              name: "Tech",
                                              value: store.scoreBreakdown
                                                .hasTechGaps
                                                ? 100
                                                : 20,
                                            },
                                            {
                                              name: "Traffic",
                                              value: store.scoreBreakdown
                                                .hasHighTraffic
                                                ? 100
                                                : 20,
                                            },
                                            {
                                              name: "Social",
                                              value: store.scoreBreakdown
                                                .hasSocialPresence
                                                ? 100
                                                : 20,
                                            },
                                            {
                                              name: "Authority",
                                              value: store.scoreBreakdown
                                                .hasStrongFounder
                                                ? 100
                                                : 20,
                                            },
                                            {
                                              name: "Verify",
                                              value: store.scoreBreakdown
                                                .isVerifiable
                                                ? 100
                                                : 20,
                                            },
                                          ]}
                                        >
                                          <XAxis dataKey="name" hide />
                                          <YAxis hide domain={[0, 100]} />
                                          <Tooltip
                                            content={({ active, payload }) => {
                                              if (
                                                active &&
                                                payload &&
                                                payload.length
                                              ) {
                                                return (
                                                  <div className="bg-bg-card px-2 py-1 border border-border-soft rounded shadow-sm text-xs font-bold text-text-main">
                                                    {payload[0].payload.name}:{" "}
                                                    {payload[0].value === 100
                                                      ? "Verified"
                                                      : "Missing"}
                                                  </div>
                                                );
                                              }
                                              return null;
                                            }}
                                          />
                                          <Bar
                                            dataKey="value"
                                            radius={[4, 4, 0, 0]}
                                          >
                                            {[
                                              {
                                                name: "Email",
                                                value: store.scoreBreakdown
                                                  .hasEmail
                                                  ? 100
                                                  : 20,
                                              },
                                              {
                                                name: "Ads",
                                                value: store.scoreBreakdown
                                                  .hasAds
                                                  ? 100
                                                  : 20,
                                              },
                                              {
                                                name: "Founder",
                                                value: store.scoreBreakdown
                                                  .hasFounder
                                                  ? 100
                                                  : 20,
                                              },
                                              {
                                                name: "Growth",
                                                value: store.scoreBreakdown
                                                  .hasGrowthSignals
                                                  ? 100
                                                  : 20,
                                              },
                                              {
                                                name: "Tech",
                                                value: store.scoreBreakdown
                                                  .hasTechGaps
                                                  ? 100
                                                  : 20,
                                              },
                                              {
                                                name: "Traffic",
                                                value: store.scoreBreakdown
                                                  .hasHighTraffic
                                                  ? 100
                                                  : 20,
                                              },
                                              {
                                                name: "Social",
                                                value: store.scoreBreakdown
                                                  .hasSocialPresence
                                                  ? 100
                                                  : 20,
                                              },
                                              {
                                                name: "Authority",
                                                value: store.scoreBreakdown
                                                  .hasStrongFounder
                                                  ? 100
                                                  : 20,
                                              },
                                              {
                                                name: "Verify",
                                                value: store.scoreBreakdown
                                                  .isVerifiable
                                                  ? 100
                                                  : 20,
                                              },
                                            ].map((entry, index) => (
                                              <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                  entry.value === 100
                                                    ? "#FF5C00"
                                                    : "#E2E8F0"
                                                }
                                              />
                                            ))}
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.hasEmail
                                            ? "Verified Email Found"
                                            : "No Verified Email"
                                        }
                                      >
                                        <Mail
                                          className={`w-4 h-4 ${store.scoreBreakdown.hasEmail ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.hasAds
                                            ? "Active Ads Detected"
                                            : "No Active Ads"
                                        }
                                      >
                                        <Megaphone
                                          className={`w-4 h-4 ${store.scoreBreakdown.hasAds ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.hasFounder
                                            ? "Founder Info Clear"
                                            : "Missing Founder Info"
                                        }
                                      >
                                        <User
                                          className={`w-4 h-4 ${store.scoreBreakdown.hasFounder ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.hasGrowthSignals
                                            ? "Growth Signals Detected"
                                            : "No Growth Signals"
                                        }
                                      >
                                        <TrendingUp
                                          className={`w-4 h-4 ${store.scoreBreakdown.hasGrowthSignals ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.hasTechGaps
                                            ? "Tech Gaps Identified"
                                            : "No Tech Gaps"
                                        }
                                      >
                                        <Zap
                                          className={`w-4 h-4 ${store.scoreBreakdown.hasTechGaps ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.hasHighTraffic
                                            ? "High Traffic Detected"
                                            : "Low Traffic"
                                        }
                                      >
                                        <BarChart3
                                          className={`w-4 h-4 ${store.scoreBreakdown.hasHighTraffic ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.hasSocialPresence
                                            ? "Strong Social Engagement"
                                            : "Low Social Presence"
                                        }
                                      >
                                        <Instagram
                                          className={`w-4 h-4 ${store.scoreBreakdown.hasSocialPresence ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.hasStrongFounder
                                            ? "Founder Authority Detected"
                                            : "Low Founder Presence"
                                        }
                                      >
                                        <Users
                                          className={`w-4 h-4 ${store.scoreBreakdown.hasStrongFounder ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                      <div
                                        className="flex items-center gap-1"
                                        title={
                                          store.scoreBreakdown.isVerifiable
                                            ? "High Verifiability"
                                            : "Low Verifiability"
                                        }
                                      >
                                        <CheckCircle2
                                          className={`w-4 h-4 ${store.scoreBreakdown.isVerifiable ? "text-emerald-500" : "text-text-muted"}`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {store.dataSources &&
                                  store.dataSources.length > 0 && (
                                    <div className="pt-4 border-t border-border-soft mt-4">
                                      <p className="text-xs text-text-muted uppercase font-bold mb-3 tracking-widest">
                                        Intelligence Sources
                                      </p>
                                      <div className="flex flex-col gap-2">
                                        {store.dataSources
                                          .filter((source) => {
                                            try {
                                              const url = new URL(source);
                                              return (
                                                !url.hostname.includes(
                                                  "run.app",
                                                ) &&
                                                !url.hostname.includes(
                                                  "localhost",
                                                )
                                              );
                                            } catch {
                                              return true;
                                            }
                                          })
                                          .slice(0, 4)
                                          .map((source, i) => {
                                            let label = "Source";
                                            try {
                                              label = new URL(
                                                source,
                                              ).hostname.replace("www.", "");
                                            } catch {}
                                            return (
                                              <a
                                                key={i}
                                                href={source}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-brand-primary hover:text-brand-secondary flex items-center justify-between group/source transition-colors bg-bg-card p-2.5 rounded-xl border border-border-soft shadow-sm"
                                              >
                                                <span className="truncate flex-1 font-bold">
                                                  {label}
                                                </span>
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
                                    <Loader2
                                      size={18}
                                      className="animate-spin"
                                    />
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
                                <button
                                  onClick={() => removeLead(store.url)}
                                  className="text-xs font-bold text-text-muted hover:text-rose-500 uppercase tracking-[0.3em] transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  ) : (
                    <div className="text-center py-24">
                      <p className="text-text-muted font-medium text-lg">
                        {activeTab === "pipeline"
                            ? "Your pipeline is empty. Save some leads first!"
                            : "You haven't saved any leads to your CRM yet."}
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
                    className="glass-card w-full max-w-2xl rounded-[32px] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-heading font-bold text-text-main">
                            Ghostwriter AI
                          </h3>
                          <p className="text-xs text-text-muted font-bold uppercase tracking-widest mt-1">
                            Hyper-Personalized Outreach
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedLeadForTemplate(null);
                          setGhostwrittenEmail(null);
                        }}
                        className="text-text-muted hover:text-rose-500 p-2 transition-colors rounded-full hover:bg-rose-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="bg-bg-main rounded-[24px] p-6 md:p-8 border border-border-soft mb-8 min-h-[240px] flex flex-col justify-center">
                      {isGeneratingEmail ? (
                        <div className="text-center space-y-6">
                          <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto" />
                          <p className="text-sm font-bold text-text-muted animate-pulse">
                            Ghostwriter is researching{" "}
                            {selectedLeadForTemplate.name}...
                          </p>
                        </div>
                      ) : ghostwrittenEmail ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-text-main leading-relaxed font-medium">
                          {ghostwrittenEmail}
                        </pre>
                      ) : (
                        <div className="text-center space-y-4">
                          <p className="text-sm font-medium text-text-muted">
                            Failed to generate email. Try again.
                          </p>
                          <button
                            onClick={() =>
                              handleGenerateEmail(selectedLeadForTemplate)
                            }
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
                        onClick={() =>
                          handleGenerateEmail(selectedLeadForTemplate)
                        }
                        className="flex-1 bg-bg-card hover:bg-bg-main text-text-main border-2 border-border-soft font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 text-sm"
                      >
                        <Zap className="w-4 h-4 text-brand-primary" />{" "}
                        Regenerate
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-8 border-t border-border-soft text-center bg-bg-card/70 backdrop-blur-xl">
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest">
            &copy; {new Date().getFullYear()} ShopHunter.ai. Powered by
            BrandScout Agent.
          </p>
        </footer>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}
