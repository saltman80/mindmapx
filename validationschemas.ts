import { z } from 'zod'
const datePreprocess = z.preprocess((val) => {
  if (typeof val === 'string') {
    return new Date(val);
  }
  return val;
}, z.date());


export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8)
}).strict();

export const refreshTokenSchema = z.object({
  token: z.string().trim().min(1).max(255)
}).strict();

export const createMindMapSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1).max(255).optional()
}).strict();

export const updateMindMapSchema = z.object({
  mindMapId: z.string().uuid(),
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().min(1).max(255).optional()
}).strict();

export const deleteMindMapSchema = z.object({
  mindMapId: z.string().uuid()
}).strict();

export const getMindMapsSchema = z.object({
  page: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return parseInt(val, 10);
    if (typeof val === 'number') return val;
    return undefined;
  }, z.number().int().positive().optional()),
  limit: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return parseInt(val, 10);
    if (typeof val === 'number') return val;
    return undefined;
  }, z.number().int().positive().optional())
}).strict();

export const createNodeSchema = z.object({
  mindMapId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().trim().min(1).max(255),
  position: z.number().int().nonnegative().optional()
}).strict();

export const updateNodeSchema = z.object({
  nodeId: z.string().uuid(),
  content: z.string().trim().min(1).max(255).optional(),
  parentId: z.string().uuid().optional(),
  position: z.number().int().nonnegative().optional()
}).strict();

export const deleteNodeSchema = z.object({
  nodeId: z.string().uuid()
}).strict();

export const getNodesSchema = z.object({
  mindMapId: z.string().uuid()
}).strict();

export const createTodoSchema = z.object({
  nodeId: z.string().uuid(),
  title: z.string().trim().min(1).max(255),
  dueDate: datePreprocess.optional(),
  tags: z.array(z.string().trim().min(1).max(255)).optional()
}).strict();

export const updateTodoSchema = z.object({
  todoId: z.string().uuid(),
  title: z.string().trim().min(1).max(255).optional(),
  completed: z.boolean().optional(),
  dueDate: datePreprocess.optional(),
  tags: z.array(z.string().trim().min(1).max(255)).optional()
}).strict();

export const deleteTodoSchema = z.object({
  todoId: z.string().uuid()
}).strict();

export const getTodosSchema = z.object({
  nodeId: z.string().uuid()
}).strict();

export const generateTodoIdeasSchema = z.object({
  mindMapId: z.string().uuid(),
  context: z.string().trim().min(1).max(255),
  count: z.number().int().positive().max(20).optional()
}).strict();

export const stripeEventSchema = z.object({
  id: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(255),
  data: z.object({
    object: z.any()
  }).strict()
}).strict();

export const stripeWebhookHeaderSchema = z.object({
  'stripe-signature': z.string().trim().min(1).max(255)
}).strict();

export const analyticsSchema = z.object({
  startDate: datePreprocess,
  endDate: datePreprocess.optional(),
  metrics: z.array(z.string().trim().min(1).max(255)).optional()
}).strict();

export const healthCheckSchema = z.object({}).strict();