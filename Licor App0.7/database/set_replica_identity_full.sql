-- Set REPLICA IDENTITY FULL for pending_orders
-- This ensures that Supabase Realtime broadcasts the full row (old and new) on updates/deletes,
-- which prevents data loss in the client-side subscription payload.

ALTER TABLE pending_orders REPLICA IDENTITY FULL;
