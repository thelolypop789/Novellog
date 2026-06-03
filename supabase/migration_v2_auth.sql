-- NovelLog v2: Multi-user auth migration
-- รันใน Supabase Dashboard → SQL Editor

-- 1. เพิ่ม user_id ใน translations
ALTER TABLE translations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE CASCADE;

-- 2. เพิ่ม user_id ใน glossary
ALTER TABLE glossary ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE CASCADE;

-- 3. สร้าง user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  credits int NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

-- 4. Enable RLS (defense-in-depth; backend ใช้ service key แต่ RLS ป้องกัน direct access)
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies
DROP POLICY IF EXISTS "translations_own" ON translations;
CREATE POLICY "translations_own" ON translations FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "glossary_own" ON glossary;
CREATE POLICY "glossary_own" ON glossary FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credits_own" ON user_credits;
CREATE POLICY "credits_own" ON user_credits FOR ALL USING (auth.uid() = user_id);
