export const LIMIT_MINDMAPS = 10
export const LIMIT_TODO_LISTS = 100
export const LIMIT_KANBAN_BOARDS = 10
// Users can run 100 AI automations per month but we allow a
// hidden buffer of 5 additional attempts. Trial users are
// limited to 10 automations during the trial period.
export const LIMIT_AI_MONTHLY = 100
export const LIMIT_AI_TRIAL = 10
export const AI_BUFFER = 5
// Total attempts allowed before blocking
export const TOTAL_AI_LIMIT = LIMIT_AI_MONTHLY + AI_BUFFER
export const TOTAL_AI_TRIAL_LIMIT = LIMIT_AI_TRIAL + AI_BUFFER
