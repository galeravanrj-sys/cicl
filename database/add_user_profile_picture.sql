-- Add profile_picture column to users table for Google OAuth profile pictures
-- This migration adds support for storing user profile pictures from Google OAuth

BEGIN;

-- Add profile_picture column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN users.profile_picture IS 'URL or base64 encoded profile picture from OAuth providers like Google';

COMMIT;