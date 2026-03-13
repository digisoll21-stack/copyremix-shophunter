export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Qualified' | 'Closed' | 'Lost';

export type EcomPlatform = 'Shopify' | 'WooCommerce' | 'BigCommerce' | 'Magento' | 'Custom';

export interface EcomStore {
  name: string;
  url: string;
  platform: EcomPlatform;
  description: string;
  niche: string;
  status?: LeadStatus;
  notes?: string;
  lastContacted?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  estimatedRevenue?: string;
  isRunningAds?: boolean;
  contactEmail?: string;
  adsPlatforms?: string[];
  adInsights?: {
    estimatedSpend?: 'Low' | 'Medium' | 'High';
    creativeStyle?: string;
    retargetingEnabled?: boolean;
    adCopyThemes?: string[];
    primaryAdPlatform?: string;
    marketingHook?: string;
    estimatedAOV?: string;
    scalingStatus?: 'Testing' | 'Scaling' | 'Stable';
  };
  apps?: string[];
  appCount?: number;
  founderInfo?: {
    name?: string;
    title?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    personalEmail?: string;
  };
  seoInsights?: {
    topKeywords?: string[];
    seoGaps?: string[];
    organicOpportunity?: string;
    seoStrategy?: string;
  };
  croInsights?: {
    trustSignals?: string[];
    checkoutFriction?: string[];
    mobileOptimization?: string;
    pageSpeedScore?: string;
    conversionKillers?: string[];
    suggestedFixes?: string[];
  };
  competitors?: {
    name: string;
    url: string;
    advantage: string;
  }[];
  growthSignals?: {
    isHiring?: boolean;
    recentNews?: string;
    newProductLaunch?: boolean;
    fundingStatus?: string;
  };
  marketGaps?: string[];
  positioning?: string;
  trafficMetrics?: {
    monthlyVisits?: number;
    bounceRate?: number;
    avgDuration?: number;
    paidTrafficPercent?: number;
    organicTrafficPercent?: number;
  };
  socialEngagement?: {
    instagramFollowers?: number;
    facebookFollowers?: number;
    twitterFollowers?: number;
    engagementLevel?: 'Low' | 'Medium' | 'High';
    lastPostDate?: string;
  };
  founderPresence?: {
    linkedinFollowers?: number;
    isThoughtLeader?: boolean;
    activityLevel?: 'Low' | 'Medium' | 'High';
  };
  // Data Quality & Verification
  confidenceScore?: number;
  intentScore?: number; // 0-100 score for "Ready to Buy"
  dataSources?: string[];
  verificationStatus?: 'Unverified' | 'AI-Verified' | 'Manually-Verified' | 'AI-Scouted' | 'Squad-Verified' | 'Verified' | 'Partially Verified';
  lastVerifiedAt?: string;
  isEmailRevealed?: boolean;
  revealedEmail?: string;
  strategicFit?: string;
  intentSignals?: string[]; // Specific reasons why they are ready to buy
  scoreBreakdown?: {
    hasEmail: boolean;
    hasAds: boolean;
    hasFounder: boolean;
    isVerifiable: boolean;
    hasGrowthSignals: boolean;
    hasTechGaps: boolean;
    hasHighTraffic: boolean;
    hasSocialPresence: boolean;
    hasStrongFounder: boolean;
  };
  closingStrategy?: {
    urgencyFactor: string;
    noBrainerPitch: string;
    objectionHandler: {
      objection: string;
      response: string;
    };
    closingHook: string;
  };
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  subscription?: Subscription;
  credits: number;
}

export interface Subscription {
  id: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
  planId: string;
  variantId: string;
  renewsAt?: string;
  endsAt?: string;
  lemonSqueezyId: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  website: string;
  offer: string;
  services: string;
  niche?: string;
  description?: string;
  createdAt: string;
  intents?: Intent[];
}

export interface Intent {
  id: string;
  businessProfileId: string;
  title: string;
  description: string;
  keywords: string[];
  pitchAngles: string[];
  searchQuery: string;
  potentialValue: 'Low' | 'Medium' | 'High' | 'Very High';
  createdAt: string;
}

export interface SearchFilters {
  revenue?: string;
  region?: string;
  adStatus?: 'all' | 'running' | 'not_running';
  techGap?: string;
}

export interface ProgressUpdate {
  step: string;
  percentage: number;
  details?: string;
  agentName?: string;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: EcomStore[];
  isSearching: boolean;
  error: string | null;
  activeMission?: Intent;
  forceFresh?: boolean;
}
