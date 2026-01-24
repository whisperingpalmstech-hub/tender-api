-- Enable Realtime for responses table
-- This allows the frontend to receive real-time updates when responses are inserted/updated

-- Add responses table to publication (enables realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE responses;

-- Also enable for documents table (already subscribed in frontend)
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
