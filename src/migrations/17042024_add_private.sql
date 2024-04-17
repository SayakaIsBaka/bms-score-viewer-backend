ALTER TABLE Charts ADD is_private INTEGER;
UPDATE Charts SET is_private = 0;
