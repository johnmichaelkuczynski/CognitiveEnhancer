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

  // Real-time streaming analysis implementation
  const handleStreamingAnalysis = async (requestBody: AnalysisRequest) => {
    console.log('🚀 STARTING STREAMING ANALYSIS', requestBody);
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📡 RESPONSE STATUS:', response.status, response.statusText);
    console.log('📡 RESPONSE HEADERS:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP ERROR:', response.status, errorText);
      throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    // Use ReadableStream directly for better browser compatibility
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamedContent = '';
    let chunkCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ STREAMING COMPLETED - Total chunks:', chunkCount);
          console.log('🏆 FINAL CONTENT LENGTH:', streamedContent.length);
          if (streamedContent.length === 0) {
            console.error('❌ NO CONTENT RECEIVED DESPITE COMPLETED STREAM');
            setAnalysisResult('❌ Error: No analysis content received from server');
          }
          break;
        }

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue; // Skip empty lines
          
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6).trim();
              if (jsonData === '') continue; // Skip empty data
              
              const data = JSON.parse(jsonData);
              chunkCount++;
              
              console.log(`📦 CHUNK ${chunkCount}:`, {
                status: data.status,
                contentLength: data.content?.length || 0,
                contentPreview: data.content?.substring(0, 30) || 'empty'
              });

              if (data.status === 'starting') {
                streamedContent = '';
                setAnalysisResult('');
                console.log('🔄 RESET CONTENT');
              } 
              else if (data.status === 'streaming') {
                streamedContent += data.content;
                // Force immediate update with React 18 flushSync for visible streaming
                import('react-dom').then(ReactDOM => {
                  if (ReactDOM.flushSync) {
                    ReactDOM.flushSync(() => {
                      setAnalysisResult(streamedContent);
                    });
                  } else {
                    setAnalysisResult(streamedContent);
                  }
                });
                console.log(`📝 UPDATED DISPLAY - Total length: ${streamedContent.length}`);
              } 
              else if (data.status === 'completed') {
                setAnalysisResult(data.content);
                console.log('🏁 FINAL CONTENT SET - Length:', data.content.length);
                return; // Exit successfully
              } 
              else if (data.status === 'error') {
                throw new Error(`Analysis error: ${data.content}`);
              }
            } catch (parseError) {
              console.error('❌ JSON Parse Error:', parseError, 'Line:', line);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const handleAnalyze = async () => {
    console.log('🎯 ANALYZE BUTTON CLICKED - Text length:', text.length);
    
    if (!text.trim()) {
      console.error('❌ NO TEXT PROVIDED');
      setAnalysisResult('❌ Error: Please enter some text to analyze before clicking the Analyze button.');
      return;
    }
    
    console.log('✅ STARTING ANALYSIS PROCESS');
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

      console.log('📤 SENDING REQUEST:', requestBody);
      await handleStreamingAnalysis(requestBody);
      console.log('✅ ANALYSIS COMPLETED SUCCESSFULLY');
    } catch (error) {
      console.error('❌ ANALYSIS ERROR:', error);
      setAnalysisResult(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🔄 RESETTING ANALYZING STATE');
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