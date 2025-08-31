import { useState, useEffect } from "react";
import Header from "@/components/text-evaluator/header";
import TextInput from "@/components/text-evaluator/text-input";
import AnalysisResults from "@/components/text-evaluator/analysis-results";
import ChunkSelector from "@/components/text-evaluator/chunk-selector";
import type { TextChunk, AnalysisRequest } from "@shared/schema";

interface ProcessedFile {
  filename: string;
  content: string;
  wordCount: number;
  chunks?: TextChunk[];
}

export default function TextEvaluator() {
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [analysisMode, setAnalysisMode] = useState<AnalysisRequest["mode"]>("cognitive-short");
  const [llmProvider, setLlmProvider] = useState<AnalysisRequest["provider"]>("zhi1");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showChunkModal, setShowChunkModal] = useState(false);
  const [currentFile, setCurrentFile] = useState<ProcessedFile | null>(null);
  const [selectedChunks, setSelectedChunks] = useState<string[]>([]);
  
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  const handleFileProcessed = (file: ProcessedFile) => {
    setCurrentFile(file);
    setText(file.content);
    
    // If file has chunks (>1000 words), show chunk selector
    if (file.chunks && file.chunks.length > 0) {
      setSelectedChunks(file.chunks.map(chunk => chunk.id));
      setShowChunkModal(true);
    } else {
      // For files under 1000 words, clear chunk state
      setSelectedChunks([]);
      setCurrentFile(null);
    }
  };

  // Utility function to handle streaming analysis
  const handleStreamingAnalysis = async (requestBody: AnalysisRequest) => {
    console.log('Starting streaming analysis...');
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(requestBody),
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
    let accumulator = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            console.log('Received event:', data.status, 'Content length:', data.content?.length || 0);
            
            if (data.status === 'starting') {
              accumulator = '';
              setAnalysisResult('');
            } else if (data.status === 'streaming') {
              accumulator += data.content;
              setAnalysisResult(accumulator);
              console.log('Accumulated length:', accumulator.length);
            } else if (data.status === 'completed') {
              setAnalysisResult(data.content);
              console.log('Analysis completed, final length:', data.content.length);
            } else if (data.status === 'error') {
              throw new Error(data.content);
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', line);
          }
        }
      }
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisResult("");
    
    try {
      let analysisText = text;
      let chunksToAnalyze: string[] = [];
      
      // If we have a file with chunks and selected chunks
      if (currentFile?.chunks && selectedChunks.length > 0) {
        const selectedChunkContents = currentFile.chunks
          .filter(chunk => selectedChunks.includes(chunk.id))
          .map(chunk => chunk.content);
        chunksToAnalyze = selectedChunkContents;
      }

      const requestBody: AnalysisRequest = {
        text: analysisText,
        mode: analysisMode,
        provider: llmProvider,
        ...(chunksToAnalyze.length > 0 && { chunks: chunksToAnalyze }),
        ...(context.trim() && { context: context.trim() })
      };

      await handleStreamingAnalysis(requestBody);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    if (!analysisResult) return;
    
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: analysisResult,
          filename: `analysis-${analysisMode}-${Date.now()}.txt`
        }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisMode}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleCopyResult = async () => {
    if (!analysisResult) return;
    
    try {
      await navigator.clipboard.writeText(analysisResult);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleExportTxt = async () => {
    if (!analysisResult) return;
    
    const blob = new Blob([analysisResult], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-export-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleChunkSelection = (selectedIds: string[]) => {
    setSelectedChunks(selectedIds);
  };

  const handleNewAnalysis = () => {
    setText("");
    setContext("");
    setAnalysisResult("");
    setCurrentFile(null);
    setSelectedChunks([]);
    setShowChunkModal(false);
  };

  const handleReanalyze = async (critique: string) => {
    if (!text.trim() || !analysisResult.trim() || !critique.trim()) return;
    
    setIsAnalyzing(true);
    const previousAnalysis = analysisResult;
    setAnalysisResult("");
    
    try {
      let analysisText = text;
      let chunksToAnalyze: string[] = [];
      
      // If we have a file with chunks and selected chunks
      if (currentFile?.chunks && selectedChunks.length > 0) {
        const selectedChunkContents = currentFile.chunks
          .filter(chunk => selectedChunks.includes(chunk.id))
          .map(chunk => chunk.content);
        chunksToAnalyze = selectedChunkContents;
      }

      const requestBody: AnalysisRequest = {
        text: analysisText,
        mode: analysisMode,
        provider: llmProvider,
        ...(chunksToAnalyze.length > 0 && { chunks: chunksToAnalyze }),
        ...(context.trim() && { context: context.trim() }),
        previousAnalysis,
        critique: critique.trim()
      };

      await handleStreamingAnalysis(requestBody);
    } catch (error) {
      console.error('Re-analysis error:', error);
      setAnalysisResult(`Re-analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeChunks = async () => {
    setShowChunkModal(false);
    await handleAnalyze();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        analysisMode={analysisMode}
        llmProvider={llmProvider}
        onAnalysisModeChange={setAnalysisMode}
        onLlmProviderChange={setLlmProvider}
        onAnalyze={handleAnalyze}
        onDownload={handleDownload}
        onNewAnalysis={handleNewAnalysis}
        isAnalyzing={isAnalyzing}
        hasResults={!!analysisResult}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        <TextInput
          text={text}
          setText={setText}
          context={context}
          setContext={setContext}
          wordCount={wordCount}
          charCount={charCount}
          onFileProcessed={handleFileProcessed}
        />
        
        <AnalysisResults
          result={analysisResult}
          isAnalyzing={isAnalyzing}
          analysisMode={analysisMode}
          onCopy={handleCopyResult}
          onExport={handleExportTxt}
          onReanalyze={handleReanalyze}
        />
      </div>

      {showChunkModal && currentFile?.chunks && (
        <ChunkSelector
          chunks={currentFile.chunks}
          selectedChunks={selectedChunks}
          onSelectionChange={handleChunkSelection}
          onAnalyze={handleAnalyzeChunks}
          onCancel={() => setShowChunkModal(false)}

        />
      )}
    </div>
  );
}