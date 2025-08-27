import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface ProcessedFile {
  filename: string;
  content: string;
  wordCount: number;
  chunks?: TextChunk[];
}

export interface TextChunk {
  id: string;
  content: string;
  wordCount: number;
  startIndex: number;
  endIndex: number;
}

export class FileProcessor {
  private readonly CHUNK_SIZE = 1000; // words per chunk

  async processFile(buffer: Buffer, filename: string): Promise<ProcessedFile> {
    const ext = path.extname(filename).toLowerCase();
    let content = '';

    switch (ext) {
      case '.txt':
        content = buffer.toString('utf-8');
        break;
      case '.pdf':
        content = await this.processPDF(buffer);
        break;
      case '.doc':
      case '.docx':
        content = await this.processWord(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    const wordCount = this.countWords(content);
    const chunks = wordCount > this.CHUNK_SIZE ? this.createChunks(content) : undefined;

    return {
      filename,
      content,
      wordCount,
      chunks
    };
  }

  private async processPDF(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to process PDF file. Please ensure the file is not corrupted.');
    }
  }

  private async processWord(buffer: Buffer): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to process Word document. Please ensure the file is not corrupted.');
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private createChunks(text: string): TextChunk[] {
    const words = text.trim().split(/\s+/);
    const chunks: TextChunk[] = [];
    
    for (let i = 0; i < words.length; i += this.CHUNK_SIZE) {
      const chunkWords = words.slice(i, i + this.CHUNK_SIZE);
      const content = chunkWords.join(' ');
      const startIndex = i;
      const endIndex = Math.min(i + this.CHUNK_SIZE - 1, words.length - 1);
      
      chunks.push({
        id: randomUUID(),
        content,
        wordCount: chunkWords.length,
        startIndex,
        endIndex
      });
    }
    
    return chunks;
  }

  extractSelectedChunks(chunks: TextChunk[], selectedIds: string[]): string {
    const selectedChunks = chunks.filter(chunk => selectedIds.includes(chunk.id));
    return selectedChunks.map(chunk => chunk.content).join('\n\n');
  }
}
