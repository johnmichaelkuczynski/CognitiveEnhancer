import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { TextChunk } from "@shared/schema";

interface ChunkSelectorProps {
  chunks: TextChunk[];
  selectedChunks: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onAnalyze: () => void;
  onCancel: () => void;
}

export default function ChunkSelector({
  chunks,
  selectedChunks,
  onSelectionChange,
  onAnalyze,
  onCancel
}: ChunkSelectorProps) {
  const handleChunkToggle = (chunkId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedChunks, chunkId]);
    } else {
      onSelectionChange(selectedChunks.filter(id => id !== chunkId));
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(chunks.map(chunk => chunk.id));
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="chunk-modal">
        <DialogHeader>
          <DialogTitle>Select Text Chunks for Analysis</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your text is longer than 1000 words. Select which chunks to analyze:
          </p>
        </DialogHeader>
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll} data-testid="button-select-all">
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone} data-testid="button-select-none">
              Select None
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            <span data-testid="selected-count">{selectedChunks.length}</span> of{" "}
            <span data-testid="total-count">{chunks.length}</span> chunks selected
          </span>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-3" data-testid="chunk-list">
          {chunks.map((chunk, index) => (
            <div 
              key={chunk.id} 
              className="p-3 border border-border rounded-md"
              data-testid={`chunk-item-${chunk.id}`}
            >
              <label className="flex items-start space-x-3 cursor-pointer">
                <Checkbox
                  checked={selectedChunks.includes(chunk.id)}
                  onCheckedChange={(checked) => handleChunkToggle(chunk.id, !!checked)}
                  className="mt-1"
                  data-testid={`checkbox-chunk-${chunk.id}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Chunk {index + 1}</span>
                    <span className="text-xs text-muted-foreground">{chunk.wordCount} words</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {chunk.content.substring(0, 200)}...
                  </p>
                </div>
              </label>
            </div>
          ))}
        </div>
        
        <div className="flex justify-between pt-4">
          <span className="text-sm text-muted-foreground self-center">
            <span>{selectedChunks.length}</span> of <span>{chunks.length}</span> chunks selected
          </span>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel} data-testid="button-cancel-chunks">
              Cancel
            </Button>
            <Button 
              onClick={onAnalyze}
              disabled={selectedChunks.length === 0}
              data-testid="button-analyze-chunks"
            >
              Analyze Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
