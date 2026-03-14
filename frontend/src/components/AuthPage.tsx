import React, { useState } from "react";
import { motion } from "motion/react";
import { Target, ArrowRight, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase.ts";
import { toast } from "sonner";

interface AuthPageProps {
  onComplete: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onComplete }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Supabase is not configured. Please check your environment variables.");
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        onComplete();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setShowSuccess(true);
        toast.success("Account created! Please check your email.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) {
      toast.error("Supabase is not configured. Please check your environment variables.");
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-6 relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#064E3B_1px,transparent_1px)] [background-size:40px_40px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card w-full max-w-md p-12 rounded-[32px] text-center relative z-10"
        >
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Mail className="text-brand-primary w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-text-main mb-4">Check your email</h2>
          <p className="text-text-muted mb-8">
            We've sent a magic link to <span className="text-text-main font-semibold">{email}</span>. 
            Please click the link to verify your account.
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-sm font-bold text-brand-primary hover:underline"
          >
            Back to login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-6 relative selection:bg-brand-primary/20">
      {/* Background Grid & Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#064E3B_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(at_0%_0%,rgba(16,185,129,0.05)_0px,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(at_100%_100%,rgba(255,92,0,0.05)_0px,transparent_50%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 md:p-12 rounded-[32px] relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 mb-6">
            <Target className="text-white w-6 h-6" />
          </div>
          <h2 className="text-3xl font-heading font-bold text-text-main mb-2">
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm text-text-muted">
            {isLogin
              ? "Enter your details to access your agents."
              : "Start your intelligence journey today."}
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 bg-white border border-border-soft rounded-xl text-sm font-semibold text-text-main flex items-center justify-center gap-3 hover:bg-bg-main transition-colors mb-6"
        >
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-soft"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-bg-card px-2 text-text-muted">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/50" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-main border border-border-soft rounded-xl py-3 pl-12 pr-4 text-sm focus:border-brand-primary outline-none transition-colors"
                placeholder="you@agency.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/50" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-main border border-border-soft rounded-xl py-3 pl-12 pr-4 text-sm focus:border-brand-primary outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brand-button w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-text-muted hover:text-brand-primary transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
