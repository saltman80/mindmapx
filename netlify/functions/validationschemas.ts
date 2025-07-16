import { z } from 'zod'

export const createMindMapSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(255).optional()
})
