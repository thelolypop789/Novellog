-- NovelLog v3: Novels table + atomic credit functions + per-novel glossary
-- รันใน Supabase Dashboard → SQL Editor

-- 1. novels table
CREATE TABLE IF NOT EXISTS novels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  lang text NOT NULL DEFAULT 'EN',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "novels_own" ON novels;
CREATE POLICY "novels_own" ON novels FOR ALL USING (auth.uid() = user_id);

-- 2. novel_id column in glossary (NULL = global glossary)
ALTER TABLE glossary ADD COLUMN IF NOT EXISTS novel_id uuid REFERENCES novels(id) ON DELETE CASCADE;

-- 3. Drop ALL unique constraints on glossary (will be replaced by partial indexes below)
--    Use catalog lookup instead of guessing names — safe to run multiple times
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'glossary'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE glossary DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- 4. Partial unique indexes: global terms and per-novel terms each have their own space
CREATE UNIQUE INDEX IF NOT EXISTS glossary_global_unique
  ON glossary (user_id, source_word, lang)
  WHERE novel_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS glossary_novel_unique
  ON glossary (user_id, source_word, lang, novel_id)
  WHERE novel_id IS NOT NULL;

-- 5. Atomic credit deduction function (fixes race condition)
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id uuid, p_amount int)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_remaining int;
BEGIN
  UPDATE user_credits SET credits = credits - p_amount
  WHERE user_id = p_user_id AND credits >= p_amount
  RETURNING credits INTO v_remaining;
  IF NOT FOUND THEN RETURN -1; END IF;
  RETURN v_remaining;
END;
$$;

-- 6. Atomic credit addition function
CREATE OR REPLACE FUNCTION add_credits(p_user_id uuid, p_amount int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE user_credits SET credits = credits + p_amount WHERE user_id = p_user_id;
END;
$$;
