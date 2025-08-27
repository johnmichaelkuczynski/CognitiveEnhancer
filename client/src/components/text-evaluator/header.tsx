import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AnalysisRequest } from "@shared/schema";

interface HeaderProps {
  analysisMode: AnalysisRequest["mode"];
  llmProvider: AnalysisRequest["provider"];
  onAnalysisModeChange: (mode: AnalysisRequest["mode"]) => void;
  onLlmProviderChange: (provider: AnalysisRequest["provider"]) => void;
  onAnalyze: () => void;
  onDownload: () => void;
  isAnalyzing: boolean;
  hasResults: boolean;
}

const analysisModeLabels = {
  "cognitive-short": "Cognitive (S)",
  "cognitive-long": "Cognitive (L)",
  "psychological-short": "Psychological (S)",
  "psychological-long": "Psychological (L)",
  "psychopathological-short": "Psychopathological (S)",
  "psychopathological-long": "Psychopathological (L)"
};

const llmProviderLabels = {
  "zhi1": "ZHI 1",
  "zhi2": "ZHI 2", 
  "zhi3": "ZHI 3",
  "zhi4": "ZHI 4"
};

export default function Header({
  analysisMode,
  llmProvider,
  onAnalysisModeChange,
  onLlmProviderChange,
  onAnalyze,
  onDownload,
  isAnalyzing,
  hasResults
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-border h-16 flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-foreground" data-testid="app-title">
        Cognitive Enhancer
      </h1>
      
      <div className="flex items-center space-x-3">
        <Select value={analysisMode} onValueChange={onAnalysisModeChange} data-testid="select-analysis-mode">
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(analysisModeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={llmProvider} onValueChange={onLlmProviderChange} data-testid="select-llm-provider">
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(llmProviderLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={onAnalyze}
          disabled={isAnalyzing}
          data-testid="button-analyze"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze"}
        </Button>
        
        <Button 
          variant="outline"
          onClick={onDownload}
          disabled={!hasResults}
          data-testid="button-download"
        >
          Download
        </Button>
      </div>
    </header>
  );
}
