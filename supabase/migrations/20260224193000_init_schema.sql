-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  key_insights JSONB,
  file_path TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies for reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON reports
  FOR DELETE USING (auth.uid() = user_id);


-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);


-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view messages from their chat sessions" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages into their chat sessions" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );
