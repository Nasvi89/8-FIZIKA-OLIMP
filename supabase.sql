-- SQL для Supabase (таблица kv — единое хранилище всех данных приложения).
-- Выполнить один раз: Supabase Dashboard → SQL Editor → New query → вставить → Run.
-- Безопасен для повторного запуска (нет ошибок при повторе).

CREATE TABLE IF NOT EXISTS public.kv (
  key   TEXT PRIMARY KEY,
  value JSONB
);

ALTER TABLE public.kv DISABLE ROW LEVEL SECURITY;

-- У каждой политики своё имя — исключает конфликт "already exists" при повторе.
DROP POLICY IF EXISTS "anon_read"   ON public.kv;
DROP POLICY IF EXISTS "anon_write"  ON public.kv;
DROP POLICY IF EXISTS "anon_insert" ON public.kv;
DROP POLICY IF EXISTS "anon_update" ON public.kv;

ALTER TABLE public.kv ENABLE ROW LEVEL SECURITY;

-- Разрешаем доступ по публичному ключу (приложение работает через publishable key).
CREATE POLICY "anon_read"   ON public.kv FOR SELECT USING (true);
CREATE POLICY "anon_insert" ON public.kv FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON public.kv FOR UPDATE USING (true);

-- Какие ключи используются:
--   users        -> объект: { login: {login, pass, name, role, className, groupTeacher} }
--   classes      -> массив: [{name, teacher, students:[{login,name}]}]
--   homework     -> массив: [{id, className, title, text, due, author, date}]
--   olympmarks   -> объект: { className: { login: { "0": true, ... } } }
--   content      -> объект: { moduleId: {conspect, videoName, videoBase64} }
--   prog_<login> -> объект прогресса конкретного пользователя