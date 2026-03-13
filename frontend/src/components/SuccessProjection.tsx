import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

export const SuccessProjection: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="p-6 bg-bg-card rounded-3xl border border-border-soft shadow-sm"
      >
        <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-4">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-1">Revenue Lift</h3>
        <p className="text-3xl font-bold text-text-main">+42%</p>
        <p className="text-xs text-brand-primary mt-2 font-medium">Projected monthly increase</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 bg-bg-card rounded-3xl border border-border-soft shadow-sm"
      >
        <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-4">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-1">New Leads</h3>
        <p className="text-3xl font-bold text-text-main">1,240</p>
        <p className="text-xs text-brand-primary mt-2 font-medium">Qualified DTC prospects</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-bg-card rounded-3xl border border-border-soft shadow-sm"
      >
        <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-4">
          <Zap className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-1">Efficiency</h3>
        <p className="text-3xl font-bold text-text-main">10x</p>
        <p className="text-xs text-brand-primary mt-2 font-medium">Faster than manual hunting</p>
      </motion.div>
    </div>
  );
};
