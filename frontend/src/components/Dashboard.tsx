import React from "react";
import { motion } from "framer-motion";
import { EcomStore } from "@shared/types";
import { Users, Target, Activity, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";

interface DashboardProps {
  savedLeads: EcomStore[];
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ savedLeads, user }) => {
  const totalLeads = savedLeads.length;
  const contactedLeads = savedLeads.filter(l => l.status === "Contacted").length;
  const qualifiedLeads = savedLeads.filter(l => l.status === "Qualified").length;
  const closedLeads = savedLeads.filter(l => l.status === "Closed").length;

  // Assuming an average deal size of $5,000 for demo purposes
  const pipelineValue = (qualifiedLeads + contactedLeads) * 5000;
  const closedValue = closedLeads * 5000;

  const recentLeads = [...savedLeads].slice(0, 5);

  const stats = [
    {
      label: "Total Leads",
      value: totalLeads,
      icon: Users,
      trend: "+12%",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      label: "Active Pipeline",
      value: `$${(pipelineValue / 1000).toFixed(1)}k`,
      icon: Activity,
      trend: "+8%",
      color: "text-brand-primary",
      bg: "bg-brand-primary/10"
    },
    {
      label: "Qualified",
      value: qualifiedLeads,
      icon: Target,
      trend: "+24%",
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      label: "Closed Won",
      value: `$${(closedValue / 1000).toFixed(1)}k`,
      icon: CheckCircle2,
      trend: "+18%",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      label: "AI Credits",
      value: user?.credits || 0,
      icon: DollarSign,
      trend: user?.plan || "FREE",
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-main tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-text-muted font-medium">
            Overview of your sales pipeline and intelligence performance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <h3 className="text-3xl font-heading font-bold text-text-main">
              {stat.value}
            </h3>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-heading font-bold text-text-main">
              Recent Discoveries
            </h2>
            <button className="text-xs font-semibold text-brand-primary uppercase tracking-widest hover:text-brand-secondary transition-colors">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead, i) => (
                <div key={lead.url} className="flex items-center justify-between p-4 rounded-2xl bg-bg-main/50 border border-border-soft hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-main">{lead.name}</h4>
                      <p className="text-xs text-text-muted">{lead.niche}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-text-muted uppercase tracking-widest">
                      {lead.status || "New"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-text-muted font-medium">No leads discovered yet.</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 rounded-3xl"
        >
          <h2 className="text-xl font-heading font-bold text-text-main mb-8">
            Pipeline Distribution
          </h2>
          <div className="space-y-6">
            {[
              { label: "New", count: totalLeads - contactedLeads - qualifiedLeads - closedLeads, color: "bg-blue-500" },
              { label: "Contacted", count: contactedLeads, color: "bg-yellow-500" },
              { label: "Qualified", count: qualifiedLeads, color: "bg-purple-500" },
              { label: "Closed", count: closedLeads, color: "bg-emerald-500" }
            ].map(status => (
              <div key={status.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-text-muted uppercase tracking-widest">{status.label}</span>
                  <span className="font-bold text-text-main">{status.count}</span>
                </div>
                <div className="w-full h-2 bg-bg-main rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${status.color}`} 
                    style={{ width: `${totalLeads > 0 ? (status.count / totalLeads) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
