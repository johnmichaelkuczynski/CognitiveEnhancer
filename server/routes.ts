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
      const { text, mode, provider, chunks } = validatedData;

      // Use chunks if provided, otherwise use full text
      const analysisText = chunks && chunks.length > 0 ? chunks.join('\n\n') : text;

      // Set up SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const analysisId = randomUUID();
      
      // Send initial event
      res.write(`data: ${JSON.stringify({ 
        id: analysisId, 
        status: 'starting', 
        content: '', 
        mode, 
        provider 
      })}\n\n`);

      try {
        let fullContent = '';
        
        for await (const chunk of llmService.streamAnalysis(analysisText, mode, provider)) {
          fullContent += chunk;
          res.write(`data: ${JSON.stringify({ 
            id: analysisId, 
            status: 'streaming', 
            content: fullContent, 
            mode, 
            provider 
          })}\n\n`);
        }

        // Send completion event
        res.write(`data: ${JSON.stringify({ 
          id: analysisId, 
          status: 'completed', 
          content: fullContent, 
          mode, 
          provider 
        })}\n\n`);
        
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
