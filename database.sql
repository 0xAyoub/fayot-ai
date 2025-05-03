-- Création des tables principales

-- Table pour stocker les documents importés
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les mémocartes
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les quiz
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les questions de quiz
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options JSONB, -- Pour stocker les options de réponse multiples
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les informations d'abonnement
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL, -- 'free', 'premium', 'pro', etc.
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  flashcards_generated INTEGER DEFAULT 0,
  quiz_questions_generated INTEGER DEFAULT 0,
  documents_uploaded INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0, -- en octets
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
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