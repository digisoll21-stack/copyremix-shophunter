import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Globe,
  BarChart3
} from 'lucide-react';

const DATA = [
  { name: 'Mon', leads: 45, intent: 82 },
  { name: 'Tue', leads: 52, intent: 88 },
  { name: 'Wed', leads: 38, intent: 75 },
  { name: 'Thu', leads: 65, intent: 92 },
  { name: 'Fri', leads: 48, intent: 85 },
  { name: 'Sat', leads: 32, intent: 70 },
  { name: 'Sun', leads: 28, intent: 65 },
];

export function LeadAnalytics() {
  return (
    <div className="p-12 lg:p-20 max-w-7xl mx-auto space-y-24">
      <header>
        <p className="text-[10px] font-medium text-brand-primary uppercase tracking-[0.5em] mb-8">Performance Intelligence</p>
        <h1 className="text-5xl md:text-7xl font-display font-light text-text-main tracking-tight mb-8">Intelligence <span className="italic">OS</span></h1>
        <p className="text-xl text-text-muted max-w-2xl leading-relaxed font-light">Real-time performance metrics and intent signals across your active missions.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {[
          { label: 'Total Leads', value: '2,842', change: '+12.5%', icon: Users },
          { label: 'High Intent', value: '842', change: '+24.8%', icon: Target },
          { label: 'Conversion', value: '4.2%', change: '+1.2%', icon: Activity },
          { label: 'Velocity', value: '98/hr', change: '+5.4%', icon: Zap },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 bg-bg-card border border-border-soft rounded-3xl shadow-sm"
          >
            <div className="flex items-center justify-between mb-10">
              <stat.icon size={20} strokeWidth={1} className="text-brand-primary" />
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest">{stat.change}</span>
            </div>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-[0.3em] mb-4">{stat.label}</p>
            <p className="text-4xl font-display font-light text-text-main tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 p-12 bg-bg-card border border-border-soft rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h3 className="text-2xl font-display font-light text-text-main mb-2">Lead Velocity</h3>
              <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest">Daily acquisition trends</p>
            </div>
            <div className="flex gap-6">
              <button className="text-[10px] font-medium text-text-muted uppercase tracking-widest hover:text-text-main transition-colors">7D</button>
              <button className="text-[10px] font-medium text-text-main uppercase tracking-widest border-b border-text-main">30D</button>
            </div>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5E34" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8B5E34" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716C', fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#78716C', fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFF', 
                    border: '1px solid #E7E5E4',
                    borderRadius: '0px',
                    fontSize: '12px',
                    fontFamily: 'Inter'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#8B5E34" 
                  strokeWidth={1}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 p-12 bg-bg-card border border-border-soft rounded-3xl shadow-sm">
          <h3 className="text-2xl font-display font-light text-text-main mb-2">Intent Score</h3>
          <p className="text-[10px] text-text-muted font-medium uppercase tracking-widest mb-16">Squad confidence levels</p>
          
          <div className="space-y-12">
            {[
              { label: 'Direct Intent', value: 85 },
              { label: 'Market Fit', value: 92 },
              { label: 'Growth Signal', value: 78 },
              { label: 'Tech Stack', value: 64 }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest">{item.label}</span>
                  <span className="text-[10px] font-medium text-text-main uppercase tracking-widest">{item.value}%</span>
                </div>
                <div className="h-px w-full bg-border-soft">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.value}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-brand-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
