-- +migrate Up
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_thru_date TIMESTAMPTZ;

-- +migrate Down
ALTER TABLE users
  DROP COLUMN IF EXISTS trial_start_date,
  DROP COLUMN IF EXISTS paid_thru_date;
