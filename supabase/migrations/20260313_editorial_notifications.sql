-- Editorial notifications table
-- Stores all notifications sent to clients and staff during the editorial process.

CREATE TABLE IF NOT EXISTS editorial_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('client', 'staff')),
  type TEXT NOT NULL CHECK (type IN (
    'welcome', 'stage_started', 'stage_completed',
    'comment_staff', 'comment_client', 'suggestion',
    'project_update', 'file_shared', 'project_completed'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  stage_key TEXT,
  metadata JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_editorial_notifications_recipient
  ON editorial_notifications(recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_editorial_notifications_project
  ON editorial_notifications(project_id, created_at DESC);

-- RLS policies
ALTER TABLE editorial_notifications ENABLE ROW LEVEL SECURITY;

-- Clients can read their own notifications
CREATE POLICY "Clients read own notifications"
  ON editorial_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

-- Clients can update (mark as read) their own notifications
CREATE POLICY "Clients update own notifications"
  ON editorial_notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Service role can insert (server-side notification creation)
-- No insert policy for anon/authenticated — inserts go through service role only.
