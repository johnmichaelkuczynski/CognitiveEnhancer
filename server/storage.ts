import { type AnalysisResponse } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for text analysis data
export interface IStorage {
  saveAnalysisResult(result: AnalysisResponse): Promise<AnalysisResponse>;
  getAnalysisResult(id: string): Promise<AnalysisResponse | undefined>;
  getRecentAnalyses(limit?: number): Promise<AnalysisResponse[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<string, AnalysisResponse>;

  constructor() {
    this.analyses = new Map();
  }

  async saveAnalysisResult(result: AnalysisResponse): Promise<AnalysisResponse> {
    this.analyses.set(result.id, result);
    return result;
  }

  async getAnalysisResult(id: string): Promise<AnalysisResponse | undefined> {
    return this.analyses.get(id);
  }

  async getRecentAnalyses(limit = 10): Promise<AnalysisResponse[]> {
    return Array.from(this.analyses.values()).slice(-limit).reverse();
  }
}

export const storage = new MemStorage();
