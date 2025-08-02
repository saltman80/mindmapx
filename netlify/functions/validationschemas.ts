import { z } from 'zod'

export const createMindMapSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(255).optional()
})

export const mapInputSchema = z.object({
  data: z.object({
    title: z.string().min(1),
    description: z.string().optional().default(''),
  }),
})

export const aiMindmapTreeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    children: z.array(aiMindmapTreeSchema).optional().default([]),
  })
)
