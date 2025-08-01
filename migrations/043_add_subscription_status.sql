-- +migrate Up
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free','trialing','active','past_due','canceled','unpaid'));

-- +migrate Down
ALTER TABLE users
  DROP COLUMN IF EXISTS subscription_status;
