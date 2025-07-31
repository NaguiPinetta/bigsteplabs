-- Check current whisper_language settings for German agents
SELECT id, name, whisper_language FROM agents WHERE name LIKE '%GERMAN%' OR name LIKE '%German%';

-- Update German agents to use German language for Whisper
UPDATE agents SET whisper_language = 'de' WHERE name LIKE '%GERMAN%' OR name LIKE '%German%';

-- Verify the update
SELECT id, name, whisper_language FROM agents WHERE name LIKE '%GERMAN%' OR name LIKE '%German%'; 