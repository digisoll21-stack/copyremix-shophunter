import { Request, Response } from "express";
import { getTechStack } from "../../shared/services/wappalyzer.ts";
import { searchGoogle } from "../../shared/services/serper.ts";
import { getSEOMetrics, getTrafficMetrics } from "../../shared/services/dataforseo.ts";
import { findContactInApollo } from "../../shared/services/apollo.ts";
import { findEmailInHunter } from "../../shared/services/hunter.ts";

export const proxyWappalyzer = async (req: Request, res: Response) => {
  const { url } = req.body;
  try {
    const data = await getTechStack(url);
    res.json(data);
  } catch (err) { res.json([]); }
};

export const proxySerper = async (req: Request, res: Response) => {
  const { q, num } = req.body;
  try {
    const data = await searchGoogle(q, num);
    res.json(data);
  } catch (err) { res.json([]); }
};

export const proxyDataForSEOSeo = async (req: Request, res: Response) => {
  const { url } = req.body;
  try {
    const data = await getSEOMetrics(url);
    res.json(data);
  } catch (err) { res.json(null); }
};

export const proxyDataForSEOTraffic = async (req: Request, res: Response) => {
  const { url } = req.body;
  try {
    const data = await getTrafficMetrics(url);
    res.json(data);
  } catch (err) { res.json(null); }
};

export const proxyApollo = async (req: Request, res: Response) => {
  const { domain, personName } = req.body;
  try {
    const data = await findContactInApollo(domain, personName);
    res.json(data);
  } catch (err) { res.json(null); }
};

export const proxyHunter = async (req: Request, res: Response) => {
  const { domain, firstName, lastName } = req.body;
  try {
    const data = await findEmailInHunter(domain, firstName, lastName);
    res.json(data);
  } catch (err) { res.json(null); }
};

export const proxyClaude = async (req: Request, res: Response) => {
  const { system, messages } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not found" });
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        system,
        messages
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) { res.status(500).json({ error: "Failed to call Claude API" }); }
};
