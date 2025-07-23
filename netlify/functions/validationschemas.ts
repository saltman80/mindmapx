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
