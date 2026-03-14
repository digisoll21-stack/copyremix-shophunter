import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Shield, FileText, Lock, Scale, Zap } from "lucide-react";

interface LegalPageProps {
  type: "privacy" | "terms";
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBack }) => {
  const isPrivacy = type === "privacy";

  return (
    <div className="min-h-screen bg-bg-main selection:bg-brand-primary/20 py-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-brand-primary transition-colors mb-12 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm uppercase tracking-widest">Back to Home</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-16 rounded-[40px] border-border-soft"
        >
          <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
              {isPrivacy ? <Shield size={32} /> : <Scale size={32} />}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-text-main tracking-tight">
                {isPrivacy ? "Privacy Policy" : "Terms of Service"}
              </h1>
              <p className="text-text-muted font-medium mt-2">Last Updated: March 13, 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-10 text-text-muted leading-relaxed">
            {isPrivacy ? (
              <>
                <section>
                  <h2 className="text-2xl font-heading font-bold text-text-main mb-4 flex items-center gap-3">
                    <Lock size={20} className="text-brand-primary" />
                    1. Information We Collect
                  </h2>
                  <p>
                    ShopHunter collects information to provide better services to all our users. We collect information in the following ways:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li><strong>Account Information:</strong> When you sign up for ShopHunter, we ask for information like your name and email address.</li>
                    <li><strong>Usage Information:</strong> We collect information about your interactions with our services, such as the features you use and the missions you deploy.</li>
                    <li><strong>Lead Data:</strong> Information processed through our AI agents for lead generation and enrichment purposes.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-text-main mb-4 flex items-center gap-3">
                    <Shield size={20} className="text-brand-primary" />
                    2. How We Use Information
                  </h2>
                  <p>
                    We use the information we collect to provide, maintain, protect and improve our services, to develop new ones, and to protect ShopHunter and our users.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-text-main mb-4 flex items-center gap-3">
                    <FileText size={20} className="text-brand-primary" />
                    3. Data Security
                  </h2>
                  <p>
                    We work hard to protect ShopHunter and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold. We use industry-standard encryption and security protocols.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h2 className="text-2xl font-heading font-bold text-text-main mb-4 flex items-center gap-3">
                    <Scale size={20} className="text-brand-primary" />
                    1. Acceptance of Terms
                  </h2>
                  <p>
                    By accessing or using ShopHunter, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-text-main mb-4 flex items-center gap-3">
                    <Zap size={20} className="text-brand-primary" />
                    2. Use License
                  </h2>
                  <p>
                    Permission is granted to temporarily use the ShopHunter platform for personal or commercial agency use. This is the grant of a license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Attempt to decompile or reverse engineer any software contained on ShopHunter's website.</li>
                    <li>Remove any copyright or other proprietary notations from the materials.</li>
                    <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-heading font-bold text-text-main mb-4 flex items-center gap-3">
                    <Shield size={20} className="text-brand-primary" />
                    3. Disclaimer
                  </h2>
                  <p>
                    The materials on ShopHunter's website are provided on an 'as is' basis. ShopHunter makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                  </p>
                </section>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
