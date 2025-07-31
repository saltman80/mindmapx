export const LIMIT_MINDMAPS = 10
export const LIMIT_TODO_LISTS = 100
export const LIMIT_KANBAN_BOARDS = 10
// Users can run 25 AI automations per month but we allow a
// hidden buffer of 5 additional attempts.
export const LIMIT_AI_MONTHLY = 25
export const AI_BUFFER = 5
// Total attempts allowed before blocking
export const TOTAL_AI_LIMIT = LIMIT_AI_MONTHLY + AI_BUFFER
