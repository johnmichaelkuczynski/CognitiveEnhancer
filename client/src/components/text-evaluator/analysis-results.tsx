import { Button } from "@/components/ui/button";
import { Brain, Copy, FileText } from "lucide-react";
import type { AnalysisRequest } from "@shared/schema";

interface AnalysisResultsProps {
  result: string;
  isAnalyzing: boolean;
  analysisMode: AnalysisRequest["mode"];
  onCopy: () => void;
  onExport: () => void;
}

const analysisModeLabels = {
  "cognitive-short": "Cognitive (S)",
  "cognitive-long": "Cognitive (L)",
  "psychological-short": "Psychological (S)",
  "psychological-long": "Psychological (L)",
  "psychopathological-short": "Psychopathological (S)",
  "psychopathological-long": "Psychopathological (L)"
};

export default function AnalysisResults({
  result,
  isAnalyzing,
  analysisMode,
  onCopy,
  onExport
}: AnalysisResultsProps) {
  const showReadyState = !result && !isAnalyzing;
  const showLoadingState = isAnalyzing && !result;
  const showResults = !!result;

  return (
    <div className="w-1/2 flex flex-col">
      <div className="p-4 border-b border-border bg-white">
        <h2 className="text-lg font-medium text-foreground" data-testid="analysis-results-title">
          Analysis Results
        </h2>
      </div>
      
      <div className="flex-1 relative bg-white overflow-y-auto">
        {showReadyState && (
          <div className="h-full flex flex-col items-center justify-center text-center" data-testid="ready-state">
            <Brain className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Ready for Analysis</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter or upload text above, select your analysis mode and LLM provider, then click "Analyze" to begin.
            </p>
          </div>
        )}
        
        {showLoadingState && (
          <div className="h-full flex flex-col items-center justify-center text-center" data-testid="loading-state">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-sm text-muted-foreground">Analyzing text...</p>
          </div>
        )}
        
        {showResults && (
          <div className="p-4" data-testid="analysis-content">
            <div 
              className="prose prose-sm max-w-none whitespace-pre-wrap"
              data-testid="analysis-text"
            >
              {result}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-border bg-muted/30 flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          <span data-testid="analysis-mode-display">{analysisModeLabels[analysisMode]}</span> • <span>Unfiltered LLM Output</span>
        </span>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCopy}
            disabled={!result}
            data-testid="button-copy"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
            disabled={!result}
            data-testid="button-export"
          >
            <FileText className="w-3 h-3 mr-1" />
            Export TXT
          </Button>
        </div>
      </div>
    </div>
  );
}
