import React from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { ArrowRight, Sparkles, TrendingUp, Zap, Target, CheckCircle2, Users, ShieldCheck, BarChart3, Globe } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-bg-main overflow-x-hidden selection:bg-brand-primary selection:text-white relative">
      {/* Background Grid & Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#064E3B_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(at_0%_0%,rgba(16,185,129,0.05)_0px,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(at_100%_100%,rgba(255,92,0,0.05)_0px,transparent_50%)]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-6 md:px-12 flex justify-between items-center bg-bg-card/70 backdrop-blur-xl border-b border-border-soft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Target className="text-white w-6 h-6" />
          </div>
          <span className="text-text-main text-2xl font-heading font-bold tracking-tight">ShopHunter</span>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={onStart} className="text-text-muted hover:text-text-main text-sm font-semibold transition-colors hidden md:block">Login</button>
          <motion.button 
            onClick={onStart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="brand-button px-8 py-3 rounded-xl text-sm font-bold"
          >
            Get Started
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center pt-32 pb-20 px-6 md:px-12 z-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-bg-card/50 backdrop-blur-md border border-border-soft text-brand-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-10 shadow-sm">
                  <Sparkles size={14} className="animate-pulse" />
                  Intelligence OS for DTC Growth
                </div>
                <h1 className="text-6xl md:text-8xl font-heading font-bold leading-[1.05] tracking-tight text-text-main mb-10">
                  Scale your Agency with <br />
                  <span className="text-gradient">Autonomous Intelligence</span>
                </h1>
                <p className="text-xl md:text-2xl text-text-muted leading-relaxed font-light mb-14 max-w-2xl">
                  ShopHunter is the first AI-powered intelligence engine built specifically for elite e-com agencies. We don't just find leads; we identify strategic intent and automate the hunt.
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <button 
                    onClick={onStart}
                    className="brand-button px-10 py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3"
                  >
                    Deploy Your Squad
                    <ArrowRight size={20} />
                  </button>
                  <button 
                    onClick={onStart}
                    className="px-10 py-5 bg-bg-card/80 backdrop-blur-md text-text-main border border-border-soft rounded-2xl font-bold text-base hover:bg-bg-card transition-all flex items-center justify-center gap-3 shadow-sm"
                  >
                    View Demo
                  </button>
                </div>
                
                <div className="mt-20 flex items-center gap-10">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-bg-card bg-bg-main overflow-hidden shadow-sm">
                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-text-main text-base">Joined by 500+ Agencies</p>
                    <div className="flex items-center gap-1 text-brand-primary mt-1">
                      {[1, 2, 3, 4, 5].map(i => <Sparkles key={i} size={14} fill="currentColor" />)}
                      <span className="text-text-muted font-medium ml-2">4.9/5 Rating</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 relative">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="absolute -inset-10 bg-brand-primary/5 blur-[100px] rounded-full animate-pulse" />
                <div className="glass-card rounded-[40px] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                  
                  <div className="bg-bg-card/50 rounded-3xl border border-border-soft p-8">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                          <Target className="text-white w-5 h-5" />
                        </div>
                        <span className="font-heading font-bold text-text-main text-lg">Active Mission</span>
                      </div>
                      <div className="px-4 py-1.5 bg-brand-primary/20 text-brand-secondary text-[10px] font-bold rounded-full tracking-widest">RUNNING</div>
                    </div>
                    <div className="space-y-6">
                      <div className="h-5 bg-bg-main rounded-full w-3/4 animate-pulse" />
                      <div className="h-5 bg-bg-main rounded-full w-1/2 animate-pulse" />
                      <div className="grid grid-cols-2 gap-6 mt-12">
                        <div className="h-24 bg-bg-card/80 rounded-2xl border border-border-soft p-5 shadow-sm">
                          <div className="h-3 bg-bg-main rounded-full w-1/2 mb-3" />
                          <div className="h-8 bg-brand-primary/5 rounded-xl w-3/4" />
                        </div>
                        <div className="h-24 bg-bg-card/80 rounded-2xl border border-border-soft p-5 shadow-sm">
                          <div className="h-3 bg-bg-main rounded-full w-1/2 mb-3" />
                          <div className="h-8 bg-brand-primary/10 rounded-xl w-3/4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-10 -right-10 w-24 h-24 bg-bg-card rounded-3xl shadow-2xl border border-border-soft flex items-center justify-center z-20"
                >
                  <TrendingUp className="text-brand-primary w-10 h-10" />
                </motion.div>
                <motion.div 
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-10 -left-10 w-24 h-24 bg-bg-card rounded-3xl shadow-2xl border border-border-soft flex items-center justify-center z-20"
                >
                  <Zap className="text-brand-primary w-10 h-10" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-24 bg-bg-card/50 backdrop-blur-md border-y border-border-soft z-10 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="text-center text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] mb-16">Powering the world's fastest growing agencies</p>
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 opacity-30 grayscale contrast-125">
            {['Shopify', 'Stripe', 'Klaviyo', 'Gorgias', 'Recharge'].map((brand) => (
              <span key={brand} className="text-3xl font-heading font-extrabold tracking-tighter text-text-main">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-40 px-6 md:px-12 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-6xl font-heading font-bold text-text-main mb-8 tracking-tight">Your Intelligence Squad</h2>
            <p className="text-xl text-text-muted font-light max-w-2xl mx-auto leading-relaxed">A specialized collective of AI agents working in perfect harmony to scale your agency operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'The Scout', desc: 'Identifies high-growth signals across the global e-commerce landscape autonomously.', icon: Target, color: 'from-brand-primary to-brand-secondary' },
              { title: 'The Strategist', desc: 'Analyzes market gaps and defines the optimal pitch for every lead in your pipeline.', icon: Sparkles, color: 'from-emerald-500 to-emerald-600' },
              { title: 'The Closer', desc: 'Ghostwrites hyper-personalized outreach that converts cold leads into warm conversations.', icon: Zap, color: 'from-blue-500 to-blue-600' }
            ].map((agent, i) => (
              <motion.div 
                key={agent.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-10 rounded-[32px] group"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${agent.color} rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-brand-primary/10`}>
                  <agent.icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-text-main mb-5 tracking-tight">{agent.title}</h3>
                <p className="text-text-muted font-light leading-relaxed text-lg">{agent.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 md:px-12 bg-text-main relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-brand-primary/10 blur-[120px] rounded-full" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-heading font-bold text-white mb-10 tracking-tight leading-[1.1]">Ready to automate your <br /> agency growth?</h2>
          <p className="text-2xl text-white/60 mb-16 font-light max-w-3xl mx-auto">Join 500+ agencies using ShopHunter to scale their outbound intelligence.</p>
          <button 
            onClick={onStart}
            className="brand-button px-16 py-6 rounded-2xl font-bold text-lg"
          >
            Get Started for Free
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 md:px-12 bg-bg-card border-t border-border-soft relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <Target className="text-white w-5 h-5" />
            </div>
            <span className="text-text-main text-2xl font-heading font-bold tracking-tight">ShopHunter</span>
          </div>
          <p className="text-base text-text-muted font-light">© 2026 ShopHunter Intelligence. All rights reserved.</p>
          <div className="flex gap-12">
            <a href="#" className="text-base text-text-muted hover:text-brand-primary font-medium transition-colors">Privacy</a>
            <a href="#" className="text-base text-text-muted hover:text-brand-primary font-medium transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
;
