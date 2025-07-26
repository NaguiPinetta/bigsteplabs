-- Add language field to agents table for Whisper configuration
ALTER TABLE agents ADD COLUMN IF NOT EXISTS whisper_language TEXT DEFAULT 'en';

-- Add comment to explain the field
COMMENT ON COLUMN agents.whisper_language IS 'Language code for Whisper transcription (e.g., en, de, es, fr). Defaults to English.';

-- Update existing agents to have English as default
UPDATE agents SET whisper_language = 'en' WHERE whisper_language IS NULL; 