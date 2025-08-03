export const LIMIT_MINDMAPS = 10
export const LIMIT_TODO_LISTS = 100
export const LIMIT_KANBAN_BOARDS = 10
export const LIMIT_MINDMAPS_TRIAL = 2
export const LIMIT_TODO_LISTS_TRIAL = 5
export const LIMIT_KANBAN_BOARDS_TRIAL = 1
// Expose a monthly limit of 100 AI automations but keep a
// server-side buffer of 5 extra attempts. Trial users are
// restricted to 10 automations during the trial period.
export const LIMIT_AI_MONTHLY = 100
export const LIMIT_AI_TRIAL = 10
export const AI_BUFFER = 5
export const TOTAL_AI_LIMIT = LIMIT_AI_MONTHLY + AI_BUFFER
export const TOTAL_AI_TRIAL_LIMIT = LIMIT_AI_TRIAL + AI_BUFFER
