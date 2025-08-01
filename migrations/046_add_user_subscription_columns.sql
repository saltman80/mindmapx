-- +migrate Up
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP DEFAULT now(),
  ADD COLUMN IF NOT EXISTS paid_thru_date TIMESTAMP;

-- +migrate Down
ALTER TABLE users
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS trial_start_date,
  DROP COLUMN IF EXISTS paid_thru_date;
