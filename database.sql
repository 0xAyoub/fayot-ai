-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.flashcard_lists (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  document_id uuid,
  title text NOT NULL,
  description text,
  card_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flashcard_lists_pkey PRIMARY KEY (id),
  CONSTRAINT flashcard_lists_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT flashcard_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.flashcards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  document_id uuid,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  list_id uuid,
  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.flashcard_lists(id),
  CONSTRAINT flashcards_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT flashcards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  quiz_id uuid NOT NULL,
  question text NOT NULL,
  correct_answer text NOT NULL,
  options jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  subscription_type text NOT NULL,
  is_active boolean DEFAULT true,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  flashcards_generated integer DEFAULT 0,
  quiz_questions_generated integer DEFAULT 0,
  documents_uploaded integer DEFAULT 0,
  storage_used bigint DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Activer RLS sur toutes les tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques pour documents
CREATE POLICY "Les utilisateurs peuvent voir leurs propres documents" 
ON documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres documents" 
ON documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres documents" 
ON documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres documents" 
ON documents FOR DELETE 
USING (auth.uid() = user_id);

-- Politiques pour flashcards
CREATE POLICY "Les utilisateurs peuvent voir leurs propres mémocartes" 
ON flashcards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres mémocartes" 
ON flashcards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres mémocartes" 
ON flashcards FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres mémocartes" 
ON flashcards FOR DELETE 
USING (auth.uid() = user_id);

-- Politiques pour quizzes
CREATE POLICY "Les utilisateurs peuvent voir leurs propres quiz" 
ON quizzes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres quiz" 
ON quizzes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres quiz" 
ON quizzes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres quiz" 
ON quizzes FOR DELETE 
USING (auth.uid() = user_id);

-- Politiques pour quiz_questions (via la relation avec quizzes)
CREATE POLICY "Les utilisateurs peuvent voir les questions de leurs propres quiz" 
ON quiz_questions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM quizzes 
  WHERE quizzes.id = quiz_questions.quiz_id 
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent insérer des questions dans leurs propres quiz" 
ON quiz_questions FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM quizzes 
  WHERE quizzes.id = quiz_questions.quiz_id 
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent mettre à jour les questions de leurs propres quiz" 
ON quiz_questions FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM quizzes 
  WHERE quizzes.id = quiz_questions.quiz_id 
  AND quizzes.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent supprimer les questions de leurs propres quiz" 
ON quiz_questions FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM quizzes 
  WHERE quizzes.id = quiz_questions.quiz_id 
  AND quizzes.user_id = auth.uid()
));

-- Politiques pour user_subscriptions
CREATE POLICY "Les utilisateurs peuvent voir leurs propres informations d'abonnement" 
ON user_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres informations d'abonnement" 
ON user_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres informations d'abonnement" 
ON user_subscriptions FOR UPDATE 
USING (auth.uid() = user_id);