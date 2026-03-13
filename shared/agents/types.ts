import { EcomStore, SearchFilters } from "../types.ts";

export interface AgentResponse<T> {
  data: T;
  confidence: number;
  sources: string[];
  agentName: string;
  timestamp: string;
}

export interface BaseAgent {
  name: string;
  role: string;
  goal: string;
  process(input: any): Promise<AgentResponse<any>>;
}
