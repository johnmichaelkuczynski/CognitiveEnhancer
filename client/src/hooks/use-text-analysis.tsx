import { useState, useCallback } from "react";
import type { AnalysisRequest, AnalysisResponse } from "@shared/schema";

export function useTextAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const analyzeText = useCallback(async (request: AnalysisRequest) => {
    setIsAnalyzing(true);
    setError(null);
    setResult("");

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: AnalysisResponse = JSON.parse(line.slice(6));
              if (data.status === 'streaming') {
                setResult(prev => prev + data.content);
              } else if (data.status === 'completed') {
                setResult(data.content);
              }
              if (data.status === 'error') {
                throw new Error(data.content);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      setResult(`Error: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult("");
    setError(null);
  }, []);

  return {
    analyzeText,
    isAnalyzing,
    result,
    error,
    clearResult
  };
}
