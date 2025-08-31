import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import { LLMService } from './services/llmService';
import { FileProcessor } from './services/fileProcessor';
import { analysisRequestSchema, fileUploadSchema } from '@shared/schema';
import { randomUUID } from 'crypto';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    cb(null, allowedTypes.includes(ext));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const llmService = new LLMService();
  const fileProcessor = new FileProcessor();

  // File upload endpoint
  app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const processedFile = await fileProcessor.processFile(req.file.buffer, req.file.originalname);
      res.json(processedFile);
    } catch (error) {
      console.error('File processing error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to process file' 
      });
    }
  });

  // Analysis endpoint with streaming
  app.post('/api/analyze', async (req: Request, res: Response) => {
    try {
      const validatedData = analysisRequestSchema.parse(req.body);
      const { text, mode, provider, chunks, context, previousAnalysis, critique } = validatedData;

      // For OpenAI (ZHI 1), process chunks sequentially with delays
      // For other providers, join chunks as before  
      const useSequentialProcessing = provider === 'zhi1' && chunks && chunks.length > 0;
      const analysisText = chunks && chunks.length > 0 && !useSequentialProcessing ? chunks.join('\n\n') : text;

      // Set up proper Server-Sent Events headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'"
      });

      // Send keep-alive ping immediately
      res.write(': keep-alive\n\n');

      const analysisId = randomUUID();
      
      // Send initial event with flush
      const startEvent = `data: ${JSON.stringify({ 
        id: analysisId, 
        status: 'starting', 
        content: '', 
        mode, 
        provider 
      })}\n\n`;
      res.write(startEvent);
      
      // Force flush to client immediately
      if ((res as any).flush) (res as any).flush();

      try {
        let fullContent = '';
        
        if (useSequentialProcessing) {
          // Sequential processing for ZHI 1 (OpenAI)
          for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];
            
            // Add chunk header
            const chunkHeader = `\n\n=== CHUNK ${i + 1} OF ${chunks.length} ===\n\n`;
            fullContent += chunkHeader;
            const headerEvent = `data: ${JSON.stringify({ 
              id: analysisId, 
              status: 'streaming', 
              content: chunkHeader, 
              mode, 
              provider 
            })}\n\n`;
            res.write(headerEvent);
            if ((res as any).flush) (res as any).flush();
            
            // Process single chunk
            for await (const streamChunk of llmService.streamAnalysis(chunkText, mode, provider, context, previousAnalysis, critique)) {
              fullContent += streamChunk;
              const streamEvent = `data: ${JSON.stringify({ 
                id: analysisId, 
                status: 'streaming', 
                content: streamChunk, 
                mode, 
                provider 
              })}\n\n`;
              res.write(streamEvent);
              
              // Force immediate flush for real-time streaming
              if ((res as any).flush) (res as any).flush();
              
              // Minimal delay for visible streaming
              await new Promise(resolve => setTimeout(resolve, 25));
            }
            
            // Wait 10 seconds between chunks (except for last chunk)
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 10000));
            }
          }
        } else {
          // Normal processing for other providers
          for await (const streamChunk of llmService.streamAnalysis(analysisText, mode, provider, context, previousAnalysis, critique)) {
            fullContent += streamChunk;
            const streamEvent = `data: ${JSON.stringify({ 
              id: analysisId, 
              status: 'streaming', 
              content: streamChunk, 
              mode, 
              provider 
            })}\n\n`;
            res.write(streamEvent);
            
            // Force immediate flush for real-time streaming
            if ((res as any).flush) (res as any).flush();
            
            // Minimal delay for visible streaming
            await new Promise(resolve => setTimeout(resolve, 25));
          }
        }

        // Send completion event with flush
        const completionEvent = `data: ${JSON.stringify({ 
          id: analysisId, 
          status: 'completed', 
          content: fullContent, 
          mode, 
          provider 
        })}\n\n`;
        res.write(completionEvent);
        if ((res as any).flush) (res as any).flush();
        
      } catch (error) {
        res.write(`data: ${JSON.stringify({ 
          id: analysisId, 
          status: 'error', 
          content: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          mode, 
          provider 
        })}\n\n`);
      }

      res.end();
    } catch (error) {
      if (error instanceof Error && error.message.includes('parse')) {
        res.status(400).json({ error: 'Invalid request data' });
      } else {
        res.status(500).json({ error: 'Analysis failed' });
      }
    }
  });

  // Download analysis results
  app.post('/api/download', async (req: Request, res: Response) => {
    try {
      const { content, filename = 'analysis-results.txt' } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'No content to download' });
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      res.status(500).json({ error: 'Download failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
