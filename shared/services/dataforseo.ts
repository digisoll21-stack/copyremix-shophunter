/**
 * DataForSEO API Service
 * Provides deep SEO metrics including keyword rankings, search volume, and domain authority.
 */

export interface SEOData {
  organic_keywords: number;
  organic_traffic: number;
  top_keywords: {
    keyword: string;
    pos: number;
    volume: number;
  }[];
  backlinks_count?: number;
  referring_domains?: number;
}

export interface TrafficData {
  total_visits: number;
  paid_traffic_percent: number;
  organic_traffic_percent: number;
  bounce_rate: number;
  avg_visit_duration: number;
  top_sources: {
    source: string;
    percent: number;
  }[];
}

export async function getSEOMetrics(url: string): Promise<SEOData | null> {
  const isServer = typeof window === 'undefined';
  const login = isServer ? process.env.DATAFORSEO_LOGIN : null;
  const password = isServer ? process.env.DATAFORSEO_PASSWORD : null;

  try {
    if (isServer) {
      if (!login || !password) {
        console.warn("DATAFORSEO credentials missing on server.");
        return null;
      }
      const domain = new URL(url).hostname.replace('www.', '');
      const auth = Buffer.from(`${login}:${password}`).toString('base64');
      const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google/keywords_for_site/live/desktop', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ target: domain, location_code: 2840, language_code: "en", include_subdomains: true, limit: 10 }])
      });
      const result = await response.json();
      if (result.tasks?.[0]?.result?.[0]) {
        const taskResult = result.tasks[0].result[0];
        return {
          organic_keywords: taskResult.metrics?.organic?.pos_1_100 || 0,
          organic_traffic: taskResult.metrics?.organic?.etv || 0,
          top_keywords: (taskResult.items || []).map((item: any) => ({
            keyword: item.keyword,
            pos: item.rank_group,
            volume: item.keyword_info?.search_volume || 0
          })),
          backlinks_count: taskResult.backlinks_info?.backlinks || 0,
          referring_domains: taskResult.backlinks_info?.referring_domains || 0
        };
      }
      return null;
    } else {
      const response = await fetch(((import.meta as any).env?.VITE_API_URL || '') + '/api/proxy/dataforseo/seo', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ url })
      });
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch SEO metrics:", error);
    return null;
  }
}

export async function getTrafficMetrics(url: string): Promise<TrafficData | null> {
  const isServer = typeof window === 'undefined';
  const login = isServer ? process.env.DATAFORSEO_LOGIN : null;
  const password = isServer ? process.env.DATAFORSEO_PASSWORD : null;

  try {
    if (isServer) {
      if (!login || !password) {
        console.warn("DATAFORSEO credentials missing on server.");
        return null;
      }
      const domain = new URL(url).hostname.replace('www.', '');
      const auth = Buffer.from(`${login}:${password}`).toString('base64');
      const response = await fetch('https://api.dataforseo.com/v3/traffic_analytics/similarweb/live', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ target: domain }])
      });
      const result = await response.json();
      if (result.tasks?.[0]?.result?.[0]) {
        const taskResult = result.tasks[0].result[0];
        return {
          total_visits: taskResult.site_metrics?.visits || 0,
          paid_traffic_percent: taskResult.traffic_sources?.ad_search?.percent || 0,
          organic_traffic_percent: taskResult.traffic_sources?.organic_search?.percent || 0,
          bounce_rate: taskResult.site_metrics?.bounce_rate || 0,
          avg_visit_duration: taskResult.site_metrics?.avg_visit_duration || 0,
          top_sources: Object.entries(taskResult.traffic_sources || {}).map(([key, value]: [string, any]) => ({
            source: key,
            percent: value.percent || 0
          }))
        };
      }
      return null;
    } else {
      const response = await fetch(((import.meta as any).env?.VITE_API_URL || '') + '/api/proxy/dataforseo/traffic', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'demo-user-123'
        },
        body: JSON.stringify({ url })
      });
      return await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch traffic metrics:", error);
    return null;
  }
}
