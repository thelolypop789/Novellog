-- NovelLog v4: Add genre and style_notes to novels table
-- รันใน Supabase Dashboard → SQL Editor

ALTER TABLE novels ADD COLUMN IF NOT EXISTS genre text;
ALTER TABLE novels ADD COLUMN IF NOT EXISTS style_notes text;
