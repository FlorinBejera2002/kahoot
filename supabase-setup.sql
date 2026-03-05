-- ============================================
-- QuizBlitz - Complete Supabase SQL Setup
-- NO user auth - admin password is frontend-only
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES
DO $$ BEGIN
  CREATE TYPE game_status AS ENUM ('lobby', 'countdown', 'showing_question', 'answering', 'showing_results', 'finished');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE answer_color AS ENUM ('red', 'blue', 'green', 'yellow');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  show_images_to_players BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  time_limit_seconds INT DEFAULT 20 CHECK (time_limit_seconds IN (5, 10, 15, 20, 30, 60)),
  points INT DEFAULT 1000,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  color answer_color NOT NULL,
  order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id),
  game_pin TEXT NOT NULL UNIQUE,
  status game_status DEFAULT 'lobby',
  current_question_index INT DEFAULT -1,
  current_question_id UUID REFERENCES public.questions(id),
  question_started_at TIMESTAMPTZ,
  answers_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.player_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  total_score INT DEFAULT 0,
  rank INT,
  streak INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.player_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_session_id UUID NOT NULL REFERENCES public.player_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  answer_id UUID REFERENCES public.answers(id),
  response_time_ms INT NOT NULL,
  points_earned INT DEFAULT 0,
  is_correct BOOLEAN DEFAULT false,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_session_id, question_id)
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_game_sessions_pin ON public.game_sessions(game_pin);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_player_sessions_game ON public.player_sessions(game_session_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_player ON public.player_answers(player_session_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_question ON public.player_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON public.questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_answers_question ON public.answers(question_id);

-- 5. FUNCTIONS

CREATE OR REPLACE FUNCTION generate_game_pin()
RETURNS TEXT AS $$
DECLARE
  new_pin TEXT;
  pin_exists BOOLEAN;
BEGIN
  LOOP
    new_pin := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.game_sessions WHERE game_pin = new_pin AND status != 'finished') INTO pin_exists;
    EXIT WHEN NOT pin_exists;
  END LOOP;
  RETURN new_pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_game_session(p_quiz_id UUID)
RETURNS JSON AS $$
DECLARE
  v_pin TEXT;
  v_session public.game_sessions;
  v_question_count INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.quizzes WHERE id = p_quiz_id) THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;
  SELECT COUNT(*) INTO v_question_count FROM public.questions WHERE quiz_id = p_quiz_id;
  IF v_question_count = 0 THEN
    RAISE EXCEPTION 'Quiz must have at least one question';
  END IF;
  v_pin := generate_game_pin();
  INSERT INTO public.game_sessions (quiz_id, game_pin, status)
  VALUES (p_quiz_id, v_pin, 'lobby')
  RETURNING * INTO v_session;
  RETURN json_build_object('id', v_session.id, 'game_pin', v_session.game_pin, 'status', v_session.status, 'quiz_id', v_session.quiz_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION join_game(p_game_pin TEXT, p_nickname TEXT, p_avatar_url TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_game public.game_sessions;
  v_player public.player_sessions;
BEGIN
  SELECT * INTO v_game FROM public.game_sessions WHERE game_pin = p_game_pin AND status = 'lobby';
  IF v_game IS NULL THEN
    RAISE EXCEPTION 'Game not found or already started';
  END IF;
  IF EXISTS (SELECT 1 FROM public.player_sessions WHERE game_session_id = v_game.id AND LOWER(nickname) = LOWER(p_nickname) AND is_active = true) THEN
    RAISE EXCEPTION 'Nickname already taken in this game';
  END IF;
  INSERT INTO public.player_sessions (game_session_id, nickname, avatar_url)
  VALUES (v_game.id, p_nickname, p_avatar_url)
  RETURNING * INTO v_player;
  RETURN json_build_object('player_session_id', v_player.id, 'game_session_id', v_game.id, 'nickname', v_player.nickname, 'avatar_url', v_player.avatar_url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_score(p_base_points INT, p_response_time_ms INT, p_time_limit_seconds INT, p_is_correct BOOLEAN, p_current_streak INT)
RETURNS JSON AS $$
DECLARE
  v_time_factor NUMERIC;
  v_points INT;
  v_streak_bonus INT;
  v_new_streak INT;
BEGIN
  IF NOT p_is_correct THEN
    RETURN json_build_object('points', 0, 'streak', 0, 'streak_bonus', 0);
  END IF;
  v_time_factor := 1.0 - (p_response_time_ms::NUMERIC / (p_time_limit_seconds * 1000)::NUMERIC) / 2.0;
  v_time_factor := GREATEST(v_time_factor, 0.5);
  v_points := FLOOR(p_base_points * v_time_factor);
  v_new_streak := p_current_streak + 1;
  v_streak_bonus := LEAST(v_new_streak * 100, 500);
  v_points := v_points + v_streak_bonus;
  RETURN json_build_object('points', v_points, 'streak', v_new_streak, 'streak_bonus', v_streak_bonus);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION submit_answer(p_player_session_id UUID, p_question_id UUID, p_answer_id UUID, p_response_time_ms INT)
RETURNS JSON AS $$
DECLARE
  v_player public.player_sessions;
  v_game public.game_sessions;
  v_question public.questions;
  v_answer public.answers;
  v_is_correct BOOLEAN;
  v_score_result JSON;
  v_points INT;
  v_new_streak INT;
  v_player_answer public.player_answers;
BEGIN
  SELECT * INTO v_player FROM public.player_sessions WHERE id = p_player_session_id;
  IF v_player IS NULL THEN RAISE EXCEPTION 'Player session not found'; END IF;
  SELECT * INTO v_game FROM public.game_sessions WHERE id = v_player.game_session_id;
  IF v_game.status != 'answering' THEN RAISE EXCEPTION 'Game is not accepting answers'; END IF;
  IF EXISTS (SELECT 1 FROM public.player_answers WHERE player_session_id = p_player_session_id AND question_id = p_question_id) THEN
    RAISE EXCEPTION 'Already answered this question';
  END IF;
  SELECT * INTO v_question FROM public.questions WHERE id = p_question_id;
  SELECT * INTO v_answer FROM public.answers WHERE id = p_answer_id AND question_id = p_question_id;
  v_is_correct := COALESCE(v_answer.is_correct, false);
  v_score_result := calculate_score(v_question.points, p_response_time_ms, v_question.time_limit_seconds, v_is_correct, v_player.streak);
  v_points := (v_score_result->>'points')::INT;
  v_new_streak := (v_score_result->>'streak')::INT;
  INSERT INTO public.player_answers (player_session_id, question_id, answer_id, response_time_ms, points_earned, is_correct)
  VALUES (p_player_session_id, p_question_id, p_answer_id, p_response_time_ms, v_points, v_is_correct)
  RETURNING * INTO v_player_answer;
  UPDATE public.player_sessions SET total_score = total_score + v_points, streak = v_new_streak WHERE id = p_player_session_id;
  UPDATE public.game_sessions SET answers_count = answers_count + 1 WHERE id = v_game.id;
  RETURN json_build_object('is_correct', v_is_correct, 'points_earned', v_points, 'streak', v_new_streak, 'streak_bonus', (v_score_result->>'streak_bonus')::INT, 'total_score', v_player.total_score + v_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION advance_question(p_game_session_id UUID)
RETURNS JSON AS $$
DECLARE
  v_game public.game_sessions;
  v_next_index INT;
  v_next_question public.questions;
  v_total_questions INT;
  v_quiz_id UUID;
BEGIN
  SELECT * INTO v_game FROM public.game_sessions WHERE id = p_game_session_id;
  IF v_game IS NULL THEN RAISE EXCEPTION 'Game not found'; END IF;
  v_quiz_id := v_game.quiz_id;
  v_next_index := v_game.current_question_index + 1;
  SELECT COUNT(*) INTO v_total_questions FROM public.questions WHERE quiz_id = v_quiz_id;
  IF v_next_index >= v_total_questions THEN
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank
      FROM public.player_sessions WHERE game_session_id = p_game_session_id AND is_active = true
    )
    UPDATE public.player_sessions ps SET rank = r.rank FROM ranked r WHERE ps.id = r.id;
    UPDATE public.game_sessions SET status = 'finished', current_question_index = v_next_index WHERE id = p_game_session_id;
    RETURN json_build_object('status', 'finished', 'question', NULL);
  END IF;
  SELECT * INTO v_next_question FROM public.questions WHERE quiz_id = v_quiz_id AND order_index = v_next_index;
  UPDATE public.game_sessions SET status = 'showing_question', current_question_index = v_next_index, current_question_id = v_next_question.id, question_started_at = NOW(), answers_count = 0
  WHERE id = p_game_session_id;
  RETURN json_build_object('status', 'showing_question', 'question_index', v_next_index, 'total_questions', v_total_questions,
    'question', json_build_object('id', v_next_question.id, 'text', v_next_question.text, 'image_url', v_next_question.image_url, 'time_limit_seconds', v_next_question.time_limit_seconds, 'points', v_next_question.points));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION start_answering(p_game_session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.game_sessions SET status = 'answering', question_started_at = NOW() WHERE id = p_game_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION show_question_results(p_game_session_id UUID)
RETURNS JSON AS $$
DECLARE
  v_game public.game_sessions;
  v_results JSON;
BEGIN
  SELECT * INTO v_game FROM public.game_sessions WHERE id = p_game_session_id;
  IF v_game IS NULL THEN RAISE EXCEPTION 'Game not found'; END IF;
  UPDATE public.game_sessions SET status = 'showing_results' WHERE id = p_game_session_id;
  SELECT json_build_object(
    'correct_answer', (SELECT json_build_object('id', a.id, 'text', a.text, 'color', a.color) FROM public.answers a WHERE a.question_id = v_game.current_question_id AND a.is_correct = true LIMIT 1),
    'answer_distribution', (SELECT json_agg(json_build_object('answer_id', a.id, 'text', a.text, 'color', a.color, 'count', COALESCE(pa.cnt, 0), 'is_correct', a.is_correct))
      FROM public.answers a LEFT JOIN (SELECT answer_id, COUNT(*) as cnt FROM public.player_answers WHERE question_id = v_game.current_question_id GROUP BY answer_id) pa ON pa.answer_id = a.id
      WHERE a.question_id = v_game.current_question_id),
    'leaderboard', (SELECT json_agg(row_data ORDER BY ts DESC)
      FROM (SELECT json_build_object('player_session_id', ps.id, 'nickname', ps.nickname, 'avatar_url', ps.avatar_url, 'total_score', ps.total_score, 'streak', ps.streak,
        'last_points', COALESCE(pa.points_earned, 0), 'last_correct', COALESCE(pa.is_correct, false)) as row_data, ps.total_score as ts
        FROM public.player_sessions ps LEFT JOIN public.player_answers pa ON pa.player_session_id = ps.id AND pa.question_id = v_game.current_question_id
        WHERE ps.game_session_id = p_game_session_id AND ps.is_active = true) sub)
  ) INTO v_results;
  RETURN v_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_podium(p_game_session_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (SELECT json_agg(json_build_object(
    'player_session_id', ps.id, 'nickname', ps.nickname, 'avatar_url', ps.avatar_url,
    'total_score', ps.total_score, 'rank', ps.rank,
    'correct_answers', (SELECT COUNT(*) FROM public.player_answers pa WHERE pa.player_session_id = ps.id AND pa.is_correct = true),
    'total_answers', (SELECT COUNT(*) FROM public.player_answers pa WHERE pa.player_session_id = ps.id)
  ) ORDER BY ps.total_score DESC) FROM public.player_sessions ps WHERE ps.game_session_id = p_game_session_id AND ps.is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION kick_player(p_game_session_id UUID, p_player_session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.player_sessions SET is_active = false WHERE id = p_player_session_id AND game_session_id = p_game_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quizzes_updated_at ON public.quizzes;
CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. ROW LEVEL SECURITY (open for anon access - admin auth is frontend-only)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe re-run)
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- QUIZZES (admin manages via frontend password)
CREATE POLICY "quizzes_all" ON public.quizzes FOR ALL USING (true) WITH CHECK (true);

-- QUESTIONS
CREATE POLICY "questions_all" ON public.questions FOR ALL USING (true) WITH CHECK (true);

-- ANSWERS
CREATE POLICY "answers_all" ON public.answers FOR ALL USING (true) WITH CHECK (true);

-- GAME SESSIONS
CREATE POLICY "game_sessions_all" ON public.game_sessions FOR ALL USING (true) WITH CHECK (true);

-- PLAYER SESSIONS
CREATE POLICY "player_sessions_all" ON public.player_sessions FOR ALL USING (true) WITH CHECK (true);

-- PLAYER ANSWERS
CREATE POLICY "player_answers_all" ON public.player_answers FOR ALL USING (true) WITH CHECK (true);

-- 7. STORAGE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('quiz-images', 'quiz-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies - allow public read and anonymous uploads
DO $$ DECLARE pol RECORD; BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'storage' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

CREATE POLICY "storage_select" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "storage_update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (true);

-- 8. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_answers;
