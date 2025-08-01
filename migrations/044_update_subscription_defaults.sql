-- +migrate Up
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS paid_thru_date TIMESTAMPTZ;
ALTER TABLE users
  ALTER COLUMN subscription_status SET DEFAULT 'trialing';
ALTER TABLE users
  ALTER COLUMN trial_start_date SET DEFAULT now();

-- +migrate Down
ALTER TABLE users
  ALTER COLUMN subscription_status SET DEFAULT 'free';
ALTER TABLE users
  ALTER COLUMN trial_start_date DROP DEFAULT;
