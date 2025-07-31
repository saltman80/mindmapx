export const LIMIT_MINDMAPS = 10
export const LIMIT_TODO_LISTS = 100
export const LIMIT_KANBAN_BOARDS = 10
// Expose a monthly limit of 25 AI automations but keep a
// server-side buffer of 5 extra attempts.
export const LIMIT_AI_MONTHLY = 25
export const AI_BUFFER = 5
export const TOTAL_AI_LIMIT = LIMIT_AI_MONTHLY + AI_BUFFER
