import { z } from "zod";

export const analysisRequestSchema = z.object({
  text: z.string().min(1),
  mode: z.enum([
    "cognitive-short",
    "cognitive-long", 
    "psychological-short",
    "psychological-long",
    "psychopathological-short",
    "psychopathological-long"
  ]),
  provider: z.enum(["zhi1", "zhi2", "zhi3"]),
  chunks: z.array(z.string()).optional()
});

export const fileUploadSchema = z.object({
  filename: z.string(),
  content: z.string(),
  wordCount: z.number()
});

export const textChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  wordCount: z.number(),
  startIndex: z.number(),
  endIndex: z.number()
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type TextChunk = z.infer<typeof textChunkSchema>;

export interface AnalysisResponse {
  id: string;
  status: 'streaming' | 'completed' | 'error';
  content: string;
  mode: string;
  provider: string;
}
