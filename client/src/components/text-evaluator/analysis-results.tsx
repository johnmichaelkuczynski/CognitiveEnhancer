import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Copy, FileText, RefreshCw } from "lucide-react";
import type { AnalysisRequest } from "@shared/schema";
import { useState } from "react";

interface AnalysisResultsProps {
  result: string;
  isAnalyzing: boolean;
  analysisMode: AnalysisRequest["mode"];
  onCopy: () => void;
  onExport: () => void;
  onReanalyze: (critique: string) => void;
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
  onExport,
  onReanalyze
}: AnalysisResultsProps) {
  const [critique, setCritique] = useState('');
  const [isSubmittingCritique, setIsSubmittingCritique] = useState(false);
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
              className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed"
              data-testid="analysis-text"
              style={{ 
                animation: isAnalyzing ? 'none' : undefined,
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {result}
              {isAnalyzing && (
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1">|</span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {showResults && (
        <div className="border-t border-border bg-white p-4">
          <div className="mb-2">
            <label className="text-sm font-medium text-foreground" htmlFor="critique-input">
              Critique Analysis & Request Re-analysis (Optional)
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Provide feedback on the analysis above and request a revised version that addresses your concerns
            </p>
          </div>
          <Textarea
            id="critique-input"
            value={critique}
            onChange={(e) => setCritique(e.target.value)}
            placeholder="E.g., 'The analysis missed important aspects of the argument structure' or 'Please focus more on the rhetorical techniques used'..."
            className="w-full h-20 resize-none text-sm mb-3"
            data-testid="textarea-critique"
          />
          <Button
            onClick={() => {
              if (critique.trim()) {
                setIsSubmittingCritique(true);
                onReanalyze(critique);
                setCritique('');
                setTimeout(() => setIsSubmittingCritique(false), 1000);
              }
            }}
            disabled={!critique.trim() || isAnalyzing || isSubmittingCritique}
            size="sm"
            data-testid="button-reanalyze"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isSubmittingCritique ? 'Submitting...' : 'Re-analyze'}
          </Button>
        </div>
      )}
      
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
