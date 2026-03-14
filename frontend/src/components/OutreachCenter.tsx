import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { EcomStore } from "@shared/types";
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Linkedin, 
  MessageSquare, 
  UserPlus, 
  Zap,
  FileText,
  BarChart3,
  ArrowRight
} from "lucide-react";

interface OutreachCentreProps {
  savedLeads: EcomStore[];
}

export const OutreachCenter: React.FC<OutreachCentreProps> = ({ savedLeads }) => {
  const [activeChannel, setActiveChannel] = useState<"email" | "linkedin">("email");
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates">("campaigns");

  const outreachLeads = savedLeads.filter(l => l.status === "New" || l.status === "Contacted");

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-heading font-bold text-text-main tracking-tight mb-2">
            Outreach Center
          </h1>
          <p className="text-text-muted font-medium">
            Manage your multi-channel outreach campaigns and automated sequences.
          </p>
        </div>
        <div className="flex bg-bg-main p-1 rounded-2xl border border-border-soft">
          <button
            onClick={() => setActiveChannel("email")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeChannel === "email"
                ? "bg-white text-brand-primary shadow-sm"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            <Mail size={18} />
            Email
          </button>
          <button
            onClick={() => setActiveChannel("linkedin")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
              activeChannel === "linkedin"
                ? "bg-white text-[#0077b5] shadow-sm"
                : "text-text-muted hover:text-text-main"
            }`}
          >
            <Linkedin size={18} />
            LinkedIn
          </button>
        </div>
      </div>

      <div className="flex gap-8 border-b border-border-soft">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-4 text-xs font-bold uppercase tracking-[0.3em] transition-all relative ${
            activeTab === "campaigns"
              ? "text-text-main"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          Active Campaigns
          {activeTab === "campaigns" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-4 text-xs font-bold uppercase tracking-[0.3em] transition-all relative ${
            activeTab === "templates"
              ? "text-text-main"
              : "text-text-muted hover:text-text-main"
          }`}
        >
          {activeChannel === "email" ? "Email Templates" : "Message Templates"}
          {activeTab === "templates" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeChannel === "email" ? (
          <motion.div
            key="email-channel"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {activeTab === "campaigns" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-heading font-bold text-text-main">
                        Ready for Email Outreach
                      </h2>
                      <button className="text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline">
                        Bulk Action
                      </button>
                    </div>
                    <div className="space-y-4">
                      {outreachLeads.length > 0 ? (
                        outreachLeads.map((lead) => (
                          <div key={lead.url} className="flex items-center justify-between p-6 rounded-2xl bg-bg-main/50 border border-border-soft hover:border-brand-primary/30 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-text-main">{lead.name}</h4>
                                <p className="text-xs text-text-muted font-medium">{lead.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                                lead.status === "Contacted" ? "bg-yellow-500/10 text-yellow-500" : "bg-brand-primary/10 text-brand-primary"
                              }`}>
                                {lead.status || "New"}
                              </span>
                              <button className="w-10 h-10 flex items-center justify-center bg-white border border-border-soft rounded-xl text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20 bg-bg-main/30 rounded-3xl border border-dashed border-border-soft">
                          <Mail className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                          <p className="text-text-muted font-medium">No leads ready for email outreach.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-8 rounded-3xl">
                    <h2 className="text-xl font-heading font-bold text-text-main mb-8">
                      Email Performance
                    </h2>
                    <div className="space-y-8">
                      {[
                        { label: "Sent", value: "1,240", icon: Send, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Opened", value: "48%", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Replied", value: "12%", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { label: "Bounced", value: "1.2%", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" }
                      ].map((stat) => (
                        <div key={stat.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                              <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-text-muted uppercase tracking-widest text-[10px]">{stat.label}</span>
                          </div>
                          <span className="text-lg font-heading font-bold text-text-main">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl text-white shadow-xl shadow-brand-primary/20">
                    <Zap className="w-8 h-8 mb-4" />
                    <h3 className="text-xl font-heading font-bold mb-2">AI Warmup Active</h3>
                    <p className="text-sm text-white/80 leading-relaxed mb-6">
                      Your sender reputation is being optimized. 42 warmup emails sent today.
                    </p>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Initial Outreach - Value Add", subject: "Quick question about {{companyName}}'s growth", type: "Cold Email" },
                  { name: "Follow Up 1 - Case Study", subject: "How we helped a similar brand scale", type: "Follow Up" },
                  { name: "Follow Up 2 - Quick Bump", subject: "Any thoughts on my last email?", type: "Follow Up" },
                  { name: "Breakup Email", subject: "Closing the loop", type: "Breakup" }
                ].map((template, i) => (
                  <div key={i} className="glass-card p-8 rounded-3xl hover:border-brand-primary/30 transition-all cursor-pointer group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary uppercase tracking-widest">
                        {template.type}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-bg-main rounded-lg text-text-muted">
                          <FileText size={14} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-text-main mb-2">{template.name}</h3>
                    <p className="text-xs text-text-muted truncate mb-6">Subject: {template.subject}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                      <span>Use Template</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="linkedin-channel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {activeTab === "campaigns" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-heading font-bold text-text-main">
                        LinkedIn Connection Queue
                      </h2>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Automation Active</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {outreachLeads.length > 0 ? (
                        outreachLeads.map((lead) => (
                          <div key={lead.url} className="flex items-center justify-between p-6 rounded-2xl bg-bg-main/50 border border-border-soft hover:border-[#0077b5]/30 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-[#0077b5]/10 flex items-center justify-center text-[#0077b5] group-hover:scale-110 transition-transform">
                                <Linkedin className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-text-main">{lead.name}</h4>
                                <p className="text-xs text-text-muted font-medium">Founder / CEO</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-bg-main" />
                                ))}
                              </div>
                              <button className="px-4 py-2 bg-white border border-border-soft rounded-xl text-[10px] font-bold text-text-main hover:text-[#0077b5] hover:border-[#0077b5] transition-all shadow-sm uppercase tracking-widest">
                                Connect
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20 bg-bg-main/30 rounded-3xl border border-dashed border-border-soft">
                          <Linkedin className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                          <p className="text-text-muted font-medium">No prospects in LinkedIn queue.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-8 rounded-3xl">
                    <h2 className="text-xl font-heading font-bold text-text-main mb-8">
                      LinkedIn Stats
                    </h2>
                    <div className="space-y-8">
                      {[
                        { label: "Invites", value: "450", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Accepted", value: "32%", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Messages", value: "85", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
                        { label: "Meetings", value: "14", icon: BarChart3, color: "text-brand-primary", bg: "bg-brand-primary/10" }
                      ].map((stat) => (
                        <div key={stat.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                              <stat.icon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-text-muted uppercase tracking-widest text-[10px]">{stat.label}</span>
                          </div>
                          <span className="text-lg font-heading font-bold text-text-main">{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 bg-white border border-border-soft rounded-3xl shadow-sm">
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest mb-4">Daily Limits</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                          <span>Connections</span>
                          <span>18 / 20</span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden">
                          <div className="h-full bg-[#0077b5] w-[90%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                          <span>Messages</span>
                          <span>42 / 100</span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 w-[42%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Connection Request - Mutual", text: "Hi {{name}}, noticed we're both in the {{niche}} space...", type: "Invite" },
                  { name: "Post-Connection Value", text: "Thanks for connecting! I recently put together a report on...", type: "Message" },
                  { name: "Event Invitation", text: "Hey {{name}}, we're hosting a private webinar for founders...", type: "Message" },
                  { name: "Follow Up - LinkedIn", text: "Just bumping this in case it got buried in your inbox...", type: "Follow Up" }
                ].map((template, i) => (
                  <div key={i} className="glass-card p-8 rounded-3xl hover:border-[#0077b5]/30 transition-all cursor-pointer group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#0077b5]/10 text-[#0077b5] uppercase tracking-widest">
                        {template.type}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-bg-main rounded-lg text-text-muted">
                          <FileText size={14} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-text-main mb-2">{template.name}</h3>
                    <p className="text-xs text-text-muted line-clamp-2 mb-6 italic">"{template.text}"</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-[#0077b5] uppercase tracking-widest">
                      <span>Use Template</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
