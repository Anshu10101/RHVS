-- Fix events visibility - set isVisible to TRUE for all existing events
UPDATE events SET isVisible = TRUE WHERE isVisible IS NULL OR isVisible = FALSE;

-- Verify the update
SELECT id, title, isVisible FROM events;
