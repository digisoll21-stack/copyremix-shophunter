import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Save, 
  Search, 
  UserPlus, 
  MoreVertical,
  Zap,
  MessageSquare,
  Target,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lock,
  Unlock,
  Terminal,
  Activity,
  TrendingUp,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  totalLeads: number;
  totalCampaigns: number;
  totalCreditsAllocated: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  plan: string;
  credits: number;
  createdAt: string;
  _count: {
    leads: number;
    campaigns: number;
    profiles: number;
  };
}

interface SystemConfig {
  id: string;
  key: string;
  value: string;
}

export const AdminPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "users" | "agents" | "logs">("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData, configsData] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/users"),
        api.get("/api/admin/config")
      ]);
      setStats(statsData);
      setUsers(usersData);
      setConfigs(configsData);
    } catch (error) {
      console.error("Admin data fetch error:", error);
      toast.error("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    try {
      await api.post("/api/admin/config", { key: editingConfig.key, value: editingConfig.value });
      toast.success("System configuration updated");
      setConfigs(prev => prev.map(c => c.key === editingConfig.key ? editingConfig : c));
      setEditingConfig(null);
    } catch (error) {
      toast.error("Failed to update system configuration");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-bold text-text-main tracking-tight mb-2">
            Super Admin Panel
          </h1>
          <p className="text-text-muted font-medium">
            Global management for ShopHunter.ai SaaS platform.
          </p>
        </div>
        <div className="flex bg-bg-main p-1 rounded-2xl border border-border-soft">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "agents", label: "Agents", icon: Terminal },
            { id: "logs", label: "Logs", icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                activeSubTab === tab.id
                  ? "bg-white text-brand-primary shadow-sm"
                  : "text-text-muted hover:text-text-main"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === "overview" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <Users size={24} />
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Users</span>
            </div>
            <div className="text-3xl font-heading font-bold text-text-main">{stats.totalUsers}</div>
            <div className="mt-2 flex items-center gap-1 text-emerald-500 text-xs font-bold">
              <TrendingUp size={12} />
              <span>+12% this month</span>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Target size={24} />
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Total Leads</span>
            </div>
            <div className="text-3xl font-heading font-bold text-text-main">{stats.totalLeads}</div>
            <div className="mt-2 flex items-center gap-1 text-text-muted text-xs font-bold">
              <span>Across all users</span>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Zap size={24} />
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Campaigns</span>
            </div>
            <div className="text-3xl font-heading font-bold text-text-main">{stats.totalCampaigns}</div>
            <div className="mt-2 flex items-center gap-1 text-text-muted text-xs font-bold">
              <span>Active sequences</span>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <DollarSign size={24} />
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Credits</span>
            </div>
            <div className="text-3xl font-heading font-bold text-text-main">{stats.totalCreditsAllocated}</div>
            <div className="mt-2 flex items-center gap-1 text-text-muted text-xs font-bold">
              <span>Total allocated</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "users" && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-border-soft rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-medium"
              />
            </div>
            <button className="px-6 py-4 bg-brand-primary text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-brand-secondary transition-all uppercase tracking-widest text-xs">
              <UserPlus size={18} />
              Add User
            </button>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-main/50 border-b border-border-soft">
                  <th className="px-8 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">User</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Role</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Plan</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Usage</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Joined</th>
                  <th className="px-8 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-bg-main/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-text-main">{user.name || "Unnamed User"}</div>
                          <div className="text-xs text-text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border-none outline-none cursor-pointer ${
                          user.role === "SUPERADMIN" ? "bg-red-500/10 text-red-500" :
                          user.role === "ADMIN" ? "bg-purple-500/10 text-purple-500" :
                          "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPERADMIN">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 text-xs font-bold text-text-muted">
                        <div className="flex items-center gap-1">
                          <Target size={12} />
                          {user._count.leads}
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap size={12} />
                          {user._count.campaigns}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs text-text-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button className="p-2 hover:bg-bg-main rounded-lg text-text-muted transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "agents" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-6 rounded-3xl">
              <h3 className="text-sm font-bold text-text-main uppercase tracking-widest mb-6">Agent Configurations</h3>
              <div className="space-y-2">
                {[
                  { key: "STRATEGY_AGENT_PROMPT", label: "Strategy Hub Agent", icon: Target },
                  { key: "DISCOVERY_AGENT_PROMPT", label: "Lead Discovery Agent", icon: Search },
                  { key: "OUTREACH_AGENT_PROMPT", label: "Email Copywriter Agent", icon: MessageSquare },
                  { key: "INTENT_AGENT_PROMPT", label: "Intent Analysis Agent", icon: Zap }
                ].map((agent) => {
                  const config = configs.find(c => c.key === agent.key);
                  return (
                    <button
                      key={agent.key}
                      onClick={() => setEditingConfig(config || { id: "", key: agent.key, value: "" })}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                        editingConfig?.key === agent.key
                          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                          : "bg-bg-main/50 text-text-muted hover:text-text-main hover:bg-bg-main"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <agent.icon size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">{agent.label}</span>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-8 bg-bg-main border border-border-soft rounded-3xl">
              <Shield className="w-8 h-8 text-brand-primary mb-4" />
              <h4 className="font-bold text-text-main mb-2">System Safety</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Modifying system prompts affects all users immediately. Ensure prompts are tested before deployment.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            {editingConfig ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 rounded-3xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-text-main">
                      Editing: {editingConfig.key.replace(/_/g, " ")}
                    </h3>
                    <p className="text-xs text-text-muted font-medium mt-1">
                      Define the core personality and rules for this AI agent.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveConfig}
                    className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-brand-secondary transition-all uppercase tracking-widest text-xs"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute top-4 left-4 text-text-muted opacity-20">
                    <Terminal size={40} />
                  </div>
                  <textarea
                    value={editingConfig.value}
                    onChange={(e) => setEditingConfig({ ...editingConfig, value: e.target.value })}
                    placeholder="Enter the system prompt here..."
                    className="w-full h-[500px] p-8 bg-bg-main/50 border border-border-soft rounded-3xl font-mono text-sm leading-relaxed focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center glass-card rounded-3xl p-20 text-center">
                <div className="w-20 h-20 rounded-full bg-bg-main flex items-center justify-center text-text-muted mb-6">
                  <Terminal size={40} />
                </div>
                <h3 className="text-xl font-heading font-bold text-text-main mb-2">Select an Agent</h3>
                <p className="text-text-muted max-w-xs mx-auto">
                  Choose an agent from the left to view and edit its system prompt configuration.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "logs" && (
        <div className="glass-card p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-heading font-bold text-text-main">System Activity Logs</h2>
            <button className="text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline flex items-center gap-2">
              <RefreshCw size={14} />
              Refresh Logs
            </button>
          </div>
          <div className="space-y-4">
            {[
              { type: "success", msg: "New user registered: sarah@example.com", time: "2 mins ago" },
              { type: "info", msg: "Discovery job completed for User ID: 8291", time: "15 mins ago" },
              { type: "warning", msg: "Failed payment attempt for User ID: 1042", time: "1 hour ago" },
              { type: "success", msg: "System prompt updated for Strategy Agent", time: "3 hours ago" },
              { type: "error", msg: "Database connection timeout in region us-east-1", time: "5 hours ago" }
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-bg-main/30 border border-border-soft">
                <div className="flex items-center gap-4">
                  {log.type === "success" ? <CheckCircle2 className="text-emerald-500" size={18} /> :
                   log.type === "error" ? <AlertCircle className="text-red-500" size={18} /> :
                   log.type === "warning" ? <AlertCircle className="text-yellow-500" size={18} /> :
                   <Activity className="text-blue-500" size={18} />}
                  <span className="text-sm font-medium text-text-main">{log.msg}</span>
                </div>
                <span className="text-xs text-text-muted">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
